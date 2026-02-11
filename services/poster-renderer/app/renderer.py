from __future__ import annotations

import importlib
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

import boto3
from botocore.client import BaseClient

from .schemas import CreateJobRequest, ThemeOption

BASE_DIR = Path(__file__).resolve().parents[1]
VENDOR_DIR = BASE_DIR / "vendor" / "maptoposter"
THEMES_DIR = VENDOR_DIR / "themes"
FONTS_DIR = VENDOR_DIR / "fonts"
LOCAL_CACHE_DIR = Path(os.environ.get("LOCAL_POSTER_CACHE_DIR", "/tmp/poster-cache"))
OBJECT_PREFIX = os.environ.get("POSTER_OBJECT_PREFIX", "posters")


class PosterRenderer:
    def __init__(self) -> None:
        self._module = self._load_renderer_module()
        self._module.THEMES_DIR = str(THEMES_DIR)
        self._module.FONTS_DIR = str(FONTS_DIR)
        self._module.FONTS = self._module.load_fonts()
        self._s3_client = self._build_s3_client()
        self._r2_bucket = os.environ.get("R2_BUCKET", "").strip()
        self._public_base_url = os.environ.get("R2_PUBLIC_BASE_URL", "").rstrip("/")
        LOCAL_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def _load_renderer_module(self):
        vendor_str = str(VENDOR_DIR)
        if vendor_str not in sys.path:
            sys.path.insert(0, vendor_str)
        return importlib.import_module("create_map_poster")

    def _build_s3_client(self) -> BaseClient | None:
        endpoint = os.environ.get("R2_ENDPOINT", "").strip()
        access_key = os.environ.get("R2_ACCESS_KEY_ID", "").strip()
        secret_key = os.environ.get("R2_SECRET_ACCESS_KEY", "").strip()
        region = os.environ.get("R2_REGION", "auto").strip()
        if not endpoint or not access_key or not secret_key:
            return None

        return boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )

    def list_themes(self) -> list[ThemeOption]:
        themes: list[ThemeOption] = []
        for theme_file in sorted(THEMES_DIR.glob("*.json")):
            with theme_file.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
            theme_id = theme_file.stem
            themes.append(
                ThemeOption(
                    id=theme_id,
                    name=payload.get("name", theme_id),
                    description=payload.get("description", ""),
                )
            )
        return themes

    def has_theme(self, theme_id: str) -> bool:
        return (THEMES_DIR / f"{theme_id}.json").exists()

    def render_to_file(self, request: CreateJobRequest, output_path: Path) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        point = self._module.get_coordinates(request.city, request.country)
        self._module.THEME = self._module.load_theme(request.theme)
        self._module.create_poster(
            city=request.city,
            country=request.country,
            point=point,
            dist=request.distance,
            output_file=str(output_path),
            output_format="png",
            width=request.width,
            height=request.height,
        )

    def _object_key(self, cache_key: str) -> str:
        return f"{OBJECT_PREFIX}/{cache_key}.png"

    def store_asset(self, cache_key: str, file_path: Path) -> str:
        if self._s3_client and self._r2_bucket:
            object_key = self._object_key(cache_key)
            self._s3_client.upload_file(
                str(file_path),
                self._r2_bucket,
                object_key,
                ExtraArgs={
                    "ContentType": "image/png",
                    "CacheControl": "public, max-age=31536000, immutable",
                },
            )
            if self._public_base_url:
                return f"{self._public_base_url}/{object_key}"

        local_target = LOCAL_CACHE_DIR / f"{cache_key}.png"
        shutil.copyfile(file_path, local_target)
        return f"/v1/assets/{cache_key}.png"

    def local_asset_path(self, cache_key: str) -> Path:
        return LOCAL_CACHE_DIR / f"{cache_key}.png"

    def make_job_payload(self, job: dict[str, Any]) -> CreateJobRequest:
        return CreateJobRequest(
            city=str(job["city"]),
            country=str(job["country"]),
            theme=str(job["theme"]),
            kind=job.get("kind", "poster"),
            distance=int(job.get("distance", 18000)),
            width=float(job.get("width", 12.0)),
            height=float(job.get("height", 16.0)),
        )

