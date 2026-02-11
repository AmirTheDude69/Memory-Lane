# Poster Renderer Service

This service runs the exact `maptoposter` Python renderer (`create_map_poster.py`) behind a FastAPI API.

## Endpoints

- `GET /healthz`
- `GET /v1/themes`
- `POST /v1/jobs`
- `GET /v1/jobs/{jobId}`
- `GET /v1/assets/{cacheKey}.png` (local fallback cache only)

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Worker process:

```bash
python -m app.worker
```

## Required environment variables

- `REDIS_URL`
- `POSTER_SERVICE_TOKEN`
- `MPLBACKEND=Agg`

R2/S3 (recommended for production):

- `R2_ENDPOINT`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BASE_URL`

