from __future__ import annotations

import os
import time
from pathlib import Path

from .queue import QueueStore
from .renderer import PosterRenderer

WORKER_POLL_TIMEOUT_SECONDS = int(os.environ.get("WORKER_POLL_TIMEOUT_SECONDS", "5"))
LOCK_WAIT_SECONDS = int(os.environ.get("WORKER_LOCK_WAIT_SECONDS", "2"))
LOCK_WAIT_RETRIES = int(os.environ.get("WORKER_LOCK_WAIT_RETRIES", "180"))


def process_job(queue: QueueStore, renderer: PosterRenderer, job_id: str) -> None:
    job = queue.get_job(job_id)
    if not job:
        return

    cache_key = job.cacheKey
    try:
        queue.update_job(job_id, status="running")

        cached_asset = queue.get_cached_asset(cache_key)
        if cached_asset:
            queue.update_job(job_id, status="completed", asset_url=cached_asset)
            queue.clear_active_job(cache_key, expected_job_id=job_id)
            return

        lock_acquired = queue.acquire_render_lock(cache_key)
        if not lock_acquired:
            for _ in range(LOCK_WAIT_RETRIES):
                existing_asset = queue.get_cached_asset(cache_key)
                if existing_asset:
                    queue.update_job(job_id, status="completed", asset_url=existing_asset)
                    queue.clear_active_job(cache_key, expected_job_id=job_id)
                    return
                time.sleep(LOCK_WAIT_SECONDS)
            raise RuntimeError("Timed out waiting for an in-flight render lock.")

        try:
            output_path = Path("/tmp/poster-jobs") / f"{cache_key}.png"
            payload = renderer.make_job_payload(job.model_dump(mode="json"))
            renderer.render_to_file(payload, output_path)
            asset_url = renderer.store_asset(cache_key, output_path)
            queue.set_cached_asset(cache_key, asset_url)
            queue.update_job(job_id, status="completed", asset_url=asset_url)
            queue.clear_active_job(cache_key, expected_job_id=job_id)
        finally:
            queue.release_render_lock(cache_key)
    except Exception as exc:
        queue.update_job(job_id, status="failed", error=str(exc))
        queue.clear_active_job(cache_key, expected_job_id=job_id)


def run_worker() -> None:
    queue = QueueStore()
    renderer = PosterRenderer()

    while True:
        job_id = queue.pop_job(timeout=WORKER_POLL_TIMEOUT_SECONDS)
        if not job_id:
            continue
        process_job(queue, renderer, job_id)


if __name__ == "__main__":
    run_worker()

