import { NextResponse } from 'next/server';

import { normalizePosterCountry } from '@/data/maptoposter';
import citiesByCountry from '@/data/posterCitiesByCountry.json';
import { POSTER_COUNTRIES } from '@/data/posterCountries';

type PosterCitiesIndex = Record<string, string[]>;

const MAX_LIMIT = 500;
const MIN_LIMIT = 20;

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  UK: 'United Kingdom',
  UAE: 'United Arab Emirates',
  Türkiye: 'Turkey',
  'Viet Nam': 'Vietnam',
};

const withUniqueSortedValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  );

const parseLimit = (value: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return 200;
  }
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, parsed));
};

const getCountryLookupCandidates = (country: string): string[] => {
  const trimmed = country.trim();
  const normalized = normalizePosterCountry(trimmed);
  const aliased = COUNTRY_NAME_ALIASES[trimmed] ?? trimmed;
  const normalizedAliased = normalizePosterCountry(aliased);

  return withUniqueSortedValues([trimmed, normalized, aliased, normalizedAliased]);
};

const getCitiesForCountry = (country: string) => {
  const index = citiesByCountry as PosterCitiesIndex;
  const candidates = getCountryLookupCandidates(country);
  for (const candidate of candidates) {
    const cityList = index[candidate];
    if (Array.isArray(cityList)) {
      return withUniqueSortedValues(cityList);
    }
  }
  return [] as string[];
};

const countries = withUniqueSortedValues([...POSTER_COUNTRIES]);

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country')?.trim() ?? '';
  const query = searchParams.get('query')?.trim().toLowerCase() ?? '';
  const limit = parseLimit(searchParams.get('limit'));

  if (!country) {
    return NextResponse.json({
      countries,
      source: 'local-index',
    });
  }

  const cities = getCitiesForCountry(country);
  const filtered = query
    ? cities.filter((city) => city.toLowerCase().includes(query))
    : cities;

  return NextResponse.json({
    cities: filtered.slice(0, limit),
    query,
    source: 'local-index',
    total: filtered.length,
  });
}

