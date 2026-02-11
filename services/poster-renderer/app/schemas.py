from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PosterJobStatus = Literal["queued", "running", "completed", "failed"]
PosterJobKind = Literal["preview", "poster"]


class CreateJobRequest(BaseModel):
    city: str = Field(min_length=1, max_length=120)
    country: str = Field(min_length=1, max_length=120)
    theme: str = Field(min_length=1, max_length=64)
    kind: PosterJobKind
    distance: int = Field(default=18000, ge=1000, le=30000)
    width: float = Field(default=12.0, gt=0.0, le=20.0)
    height: float = Field(default=16.0, gt=0.0, le=20.0)


class JobResponse(BaseModel):
    jobId: str
    status: PosterJobStatus
    cacheKey: str
    assetUrl: str | None = None
    previewUrl: str | None = None
    error: str | None = None


class JobRecord(JobResponse):
    kind: PosterJobKind
    city: str
    country: str
    theme: str
    distance: int
    width: float
    height: float
    createdAt: datetime
    updatedAt: datetime


class ThemeOption(BaseModel):
    id: str
    name: str
    description: str = ""

