from __future__ import annotations

import os

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .queue import QueueStore, build_cache_key
from .renderer import PosterRenderer
from .schemas import CreateJobRequest, JobResponse, ThemeOption

app = FastAPI(title="Memory Lane Poster Renderer", version="1.0.0")
auth_scheme = HTTPBearer(auto_error=False)
queue = QueueStore()
renderer = PosterRenderer()


def authorize(credentials: HTTPAuthorizationCredentials | None = Depends(auth_scheme)) -> None:
    expected_token = os.environ.get("POSTER_SERVICE_TOKEN", "").strip()
    if not expected_token:
        return

    if not credentials or credentials.credentials != expected_token:
        raise HTTPException(status_code=401, detail="Unauthorized")


def with_absolute_asset_url(request: Request, asset_url: str | None) -> str | None:
    if not asset_url:
        return None
    if asset_url.startswith("http://") or asset_url.startswith("https://"):
        return asset_url
    base = str(request.base_url).rstrip("/")
    if asset_url.startswith("/"):
        return f"{base}{asset_url}"
    return f"{base}/{asset_url}"


@app.get("/healthz")
def healthz() -> dict[str, str]:
    queue.ping()
    return {"status": "ok"}


@app.get("/v1/themes", response_model=list[ThemeOption], dependencies=[Depends(authorize)])
def list_themes() -> list[ThemeOption]:
    return renderer.list_themes()


@app.post("/v1/jobs", response_model=JobResponse, dependencies=[Depends(authorize)])
def create_job(request: Request, payload: CreateJobRequest) -> JobResponse:
    theme_id = payload.theme.strip().lower()
    payload.theme = theme_id
    if not renderer.has_theme(theme_id):
        raise HTTPException(status_code=400, detail=f"Unknown theme '{payload.theme}'")

    cache_key = build_cache_key(payload)
    cached_asset = queue.get_cached_asset(cache_key)
    if cached_asset:
        cached_job = queue.create_job(payload, cache_key)
        queue.update_job(cached_job.jobId, status="completed", asset_url=cached_asset)
        queue.clear_active_job(cache_key, expected_job_id=cached_job.jobId)
        absolute_asset = with_absolute_asset_url(request, cached_asset)
        return JobResponse(
            jobId=cached_job.jobId,
            status="completed",
            cacheKey=cache_key,
            assetUrl=absolute_asset,
            previewUrl=absolute_asset,
        )

    active_job_id = queue.get_active_job_id(cache_key)
    if active_job_id:
        active_job = queue.get_job(active_job_id)
        if active_job:
            active_job.assetUrl = with_absolute_asset_url(request, active_job.assetUrl)
            active_job.previewUrl = with_absolute_asset_url(request, active_job.previewUrl)
            return JobResponse.model_validate(active_job.model_dump())

    job = queue.create_job(payload, cache_key)
    queue.enqueue(job.jobId)
    return JobResponse(jobId=job.jobId, status=job.status, cacheKey=job.cacheKey)


@app.get("/v1/jobs/{job_id}", response_model=JobResponse, dependencies=[Depends(authorize)])
def get_job(request: Request, job_id: str) -> JobResponse:
    job = queue.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.assetUrl = with_absolute_asset_url(request, job.assetUrl)
    job.previewUrl = with_absolute_asset_url(request, job.previewUrl)
    return JobResponse.model_validate(job.model_dump())


@app.get("/v1/assets/{cache_key}.png")
def get_local_asset(cache_key: str) -> FileResponse:
    asset_path = renderer.local_asset_path(cache_key)
    if not asset_path.exists():
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(
        path=asset_path,
        media_type="image/png",
        filename=f"{cache_key}.png",
    )
