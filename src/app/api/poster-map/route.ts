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
const STATIC_MAP_URL = 'https://staticmap.openstreetmap.de/staticmap.php';
const GEOCODE_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const geocodeCache = new Map<string, GeocodeCacheValue>();

const DEFAULT_ZOOM = 12;
const DEFAULT_SIZE = 1000;
const MIN_SIZE = 300;
const MAX_SIZE = 1200;
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

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country')?.trim() ?? '';
  const city = searchParams.get('city')?.trim() ?? '';

  if (!country || !city) {
    return NextResponse.json({ error: 'Country and city are required.' }, { status: 400 });
  }

  const size = parseBoundedInt(searchParams.get('size'), DEFAULT_SIZE, MIN_SIZE, MAX_SIZE);
  const zoom = parseBoundedInt(searchParams.get('zoom'), DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM);

  try {
    const { lat, lon } = await geocodeCity(city, country);

    const staticMapUrl = new URL(STATIC_MAP_URL);
    staticMapUrl.searchParams.set('center', `${lat},${lon}`);
    staticMapUrl.searchParams.set('zoom', String(zoom));
    staticMapUrl.searchParams.set('size', `${size}x${size}`);
    staticMapUrl.searchParams.set('maptype', 'mapnik');

    const response = await fetch(staticMapUrl, {
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
