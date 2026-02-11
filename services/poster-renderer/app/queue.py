from __future__ import annotations

import hashlib
import json
import os
import uuid
from datetime import UTC, datetime
from typing import Any

from redis import Redis

from .schemas import CreateJobRequest, JobRecord, PosterJobStatus

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
QUEUE_KEY = "poster:queue"
JOB_KEY_PREFIX = "poster:job:"
ASSET_KEY_PREFIX = "poster:asset:"
ACTIVE_JOB_KEY_PREFIX = "poster:active:"
RENDER_LOCK_KEY_PREFIX = "poster:lock:"

RENDERER_VERSION = os.environ.get("POSTER_RENDERER_VERSION", "maptoposter-vendor")
SERVICE_VERSION = os.environ.get("POSTER_SERVICE_VERSION", "1")


def utc_now() -> datetime:
    return datetime.now(UTC)


def to_json(value: dict[str, Any]) -> str:
    return json.dumps(value, separators=(",", ":"), default=str)


def from_json(value: str | None) -> dict[str, Any] | None:
    if not value:
        return None
    return json.loads(value)


def build_cache_key(payload: CreateJobRequest) -> str:
    canonical = {
        "city": payload.city.strip(),
        "country": payload.country.strip(),
        "theme": payload.theme.strip().lower(),
        "mode": "exact",
        "distance": payload.distance,
        "width": payload.width,
        "height": payload.height,
        "renderer_version": RENDERER_VERSION,
        "service_version": SERVICE_VERSION,
    }
    encoded = json.dumps(canonical, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:40]


class QueueStore:
    def __init__(self, redis_url: str = REDIS_URL):
        self.client = Redis.from_url(redis_url, decode_responses=True)

    def ping(self) -> bool:
        return bool(self.client.ping())

    def _job_key(self, job_id: str) -> str:
        return f"{JOB_KEY_PREFIX}{job_id}"

    def _asset_key(self, cache_key: str) -> str:
        return f"{ASSET_KEY_PREFIX}{cache_key}"

    def _active_key(self, cache_key: str) -> str:
        return f"{ACTIVE_JOB_KEY_PREFIX}{cache_key}"

    def _lock_key(self, cache_key: str) -> str:
        return f"{RENDER_LOCK_KEY_PREFIX}{cache_key}"

    def get_job(self, job_id: str) -> JobRecord | None:
        payload = from_json(self.client.get(self._job_key(job_id)))
        if payload is None:
            return None
        payload["createdAt"] = datetime.fromisoformat(payload["createdAt"])
        payload["updatedAt"] = datetime.fromisoformat(payload["updatedAt"])
        return JobRecord.model_validate(payload)

    def save_job(self, job: JobRecord) -> None:
        self.client.set(self._job_key(job.jobId), to_json(job.model_dump(mode="json")))

    def create_job(self, request: CreateJobRequest, cache_key: str) -> JobRecord:
        job_id = str(uuid.uuid4())
        now = utc_now()
        job = JobRecord(
            jobId=job_id,
            status="queued",
            cacheKey=cache_key,
            kind=request.kind,
            city=request.city.strip(),
            country=request.country.strip(),
            theme=request.theme.strip(),
            distance=request.distance,
            width=request.width,
            height=request.height,
            createdAt=now,
            updatedAt=now,
        )
        self.save_job(job)
        self.client.set(self._active_key(cache_key), job_id, ex=3600)
        return job

    def update_job(
        self,
        job_id: str,
        *,
        status: PosterJobStatus | None = None,
        asset_url: str | None = None,
        error: str | None = None,
    ) -> JobRecord | None:
        job = self.get_job(job_id)
        if job is None:
            return None

        if status is not None:
            job.status = status
        if asset_url is not None:
            job.assetUrl = asset_url
            job.previewUrl = asset_url
            job.error = None
        elif error is not None:
            job.error = error
        job.updatedAt = utc_now()
        self.save_job(job)
        return job

    def enqueue(self, job_id: str) -> None:
        self.client.lpush(QUEUE_KEY, job_id)

    def pop_job(self, timeout: int = 5) -> str | None:
        item = self.client.brpop(QUEUE_KEY, timeout=timeout)
        if not item:
            return None
        return item[1]

    def get_cached_asset(self, cache_key: str) -> str | None:
        return self.client.get(self._asset_key(cache_key))

    def set_cached_asset(self, cache_key: str, asset_url: str) -> None:
        self.client.set(self._asset_key(cache_key), asset_url)

    def get_active_job_id(self, cache_key: str) -> str | None:
        return self.client.get(self._active_key(cache_key))

    def clear_active_job(self, cache_key: str, expected_job_id: str | None = None) -> None:
        key = self._active_key(cache_key)
        if expected_job_id is None:
            self.client.delete(key)
            return

        current = self.client.get(key)
        if current == expected_job_id:
            self.client.delete(key)

    def acquire_render_lock(self, cache_key: str, ttl_seconds: int = 900) -> bool:
        return bool(self.client.set(self._lock_key(cache_key), "1", ex=ttl_seconds, nx=True))

    def release_render_lock(self, cache_key: str) -> None:
        self.client.delete(self._lock_key(cache_key))

