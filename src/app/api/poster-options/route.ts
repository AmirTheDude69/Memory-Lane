import { NextResponse } from 'next/server';
import worldLow from '@amcharts/amcharts5-geodata/json/worldLow';

import { normalizePosterCountry } from '@/data/maptoposter';

type CitiesResponse = {
  data?: string[];
  error?: boolean;
};

type CacheValue = {
  expiresAt: number;
  value: string[];
};

const CITIES_URL = 'https://countriesnow.space/api/v0.1/countries/cities/q?country=';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_LIMIT = 500;
const MIN_LIMIT = 20;

const countriesCache: { current: CacheValue | null } = { current: null };
const citiesCache = new Map<string, CacheValue>();

const withUniqueSortedValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  );

const isFresh = (cache: CacheValue | null) =>
  Boolean(cache && cache.expiresAt > Date.now() && cache.value.length > 0);

const parseLimit = (value: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return 200;
  }
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, parsed));
};

const LOCAL_COUNTRIES = withUniqueSortedValues(
  (
    worldLow as {
      features?: Array<{
        properties?: {
          name?: string;
        };
      }>;
    }
  ).features?.map((feature) => feature.properties?.name ?? '') ?? []
);

const getCountries = async () => {
  if (isFresh(countriesCache.current)) {
    return countriesCache.current!.value;
  }

  countriesCache.current = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value: LOCAL_COUNTRIES,
  };

  return LOCAL_COUNTRIES;
};

const getCities = async (country: string) => {
  const normalizedCountry = normalizePosterCountry(country);
  const cached = citiesCache.get(normalizedCountry);

  if (isFresh(cached ?? null)) {
    return cached!.value;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 10_000);

  const response = await fetch(`${CITIES_URL}${encodeURIComponent(normalizedCountry)}`, {
    next: { revalidate: 60 * 60 * 6 },
    signal: abortController.signal,
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Cities fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as CitiesResponse;
  if (payload.error) {
    throw new Error('Cities API returned error.');
  }

  const cities = withUniqueSortedValues(payload.data ?? []);

  citiesCache.set(normalizedCountry, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value: cities,
  });

  return cities;
};

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country')?.trim() ?? '';
  const query = searchParams.get('query')?.trim().toLowerCase() ?? '';
  const limit = parseLimit(searchParams.get('limit'));

  if (!country) {
    const countries = await getCountries();
    return NextResponse.json({ countries, source: 'local-world' });
  }

  try {
    const cities = await getCities(country);
    const filtered = query
      ? cities.filter((city) => city.toLowerCase().includes(query))
      : cities;

    return NextResponse.json({
      cities: filtered.slice(0, limit),
      query,
      total: filtered.length,
    });
  } catch {
    return NextResponse.json({
      cities: [],
      query,
      total: 0,
    });
  }
}
