import { NextResponse } from 'next/server';

import { normalizePosterCountry } from '@/data/maptoposter';

type GeocodeResult = {
  lat?: string;
  lon?: string;
};

type GeocodeCacheValue = {
  expiresAt: number;
  lat: number;
  lon: number;
};

const GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';
const OSM_TILE_URL = 'https://tile.openstreetmap.org';
const GEOCODE_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const geocodeCache = new Map<string, GeocodeCacheValue>();

const DEFAULT_ZOOM = 12;
const MIN_ZOOM = 8;
const MAX_ZOOM = 16;

const parseBoundedInt = (
  value: string | null,
  defaultValue: number,
  min: number,
  max: number
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, parsed));
};

const geocodeCity = async (city: string, country: string) => {
  const normalizedCountry = normalizePosterCountry(country);
  const cacheKey = `${normalizedCountry.toLowerCase()}::${city.toLowerCase()}`;
  const cached = geocodeCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return { lat: cached.lat, lon: cached.lon };
  }

  const firstAttemptUrl = new URL(GEOCODE_URL);
  firstAttemptUrl.searchParams.set('format', 'jsonv2');
  firstAttemptUrl.searchParams.set('limit', '1');
  firstAttemptUrl.searchParams.set('city', city);
  firstAttemptUrl.searchParams.set('country', normalizedCountry);

  const requestOptions = {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'Memory-Lane/1.0 (poster-generator)',
    },
    next: {
      revalidate: 60 * 60 * 24,
    },
  } as const;

  let response = await fetch(firstAttemptUrl, requestOptions);
  let payload = (await response.json()) as GeocodeResult[];

  if (!response.ok || payload.length === 0) {
    const fallbackUrl = new URL(GEOCODE_URL);
    fallbackUrl.searchParams.set('format', 'jsonv2');
    fallbackUrl.searchParams.set('limit', '1');
    fallbackUrl.searchParams.set('q', `${city}, ${normalizedCountry}`);

    response = await fetch(fallbackUrl, requestOptions);
    payload = (await response.json()) as GeocodeResult[];
  }

  const firstResult = payload[0];
  const lat = Number.parseFloat(firstResult?.lat ?? '');
  const lon = Number.parseFloat(firstResult?.lon ?? '');

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Could not geocode location.');
  }

  geocodeCache.set(cacheKey, {
    expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS,
    lat,
    lon,
  });

  return { lat, lon };
};

const toTileXY = (latitude: number, longitude: number, zoom: number) => {
  const safeLat = Math.max(-85.0511, Math.min(85.0511, latitude));
  const safeLon = ((longitude + 180) % 360 + 360) % 360 - 180;
  const n = 2 ** zoom;
  const x = Math.floor(((safeLon + 180) / 360) * n);
  const y = Math.floor(
    ((1 -
      Math.log(
        Math.tan((safeLat * Math.PI) / 180) + 1 / Math.cos((safeLat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      n
  );

  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y)),
  };
};

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country')?.trim() ?? '';
  const city = searchParams.get('city')?.trim() ?? '';

  if (!country || !city) {
    return NextResponse.json({ error: 'Country and city are required.' }, { status: 400 });
  }

  const zoom = parseBoundedInt(searchParams.get('zoom'), DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM);

  try {
    const { lat, lon } = await geocodeCity(city, country);
    const { x, y } = toTileXY(lat, lon, zoom);
    const tileUrl = `${OSM_TILE_URL}/${zoom}/${x}/${y}.png`;

    const response = await fetch(tileUrl, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok || !response.body) {
      throw new Error('Static map fetch failed.');
    }

    return new Response(response.body, {
      headers: {
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'Content-Type': 'image/png',
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not generate map preview for this location right now.' },
      { status: 502 }
    );
  }
}
