import { NextResponse } from 'next/server';

type CountryCategoryKey = 'together' | 'amir' | 'vlada' | 'separate' | 'wish';
type CountryGroups = Record<CountryCategoryKey, string[]>;

const CATEGORY_KEYS: CountryCategoryKey[] = ['together', 'amir', 'vlada', 'separate', 'wish'];

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/19-38eFrsKefBkUX69pU05Mzz21A6gdwg3mNThzjpi4A/gviz/tq?tqx=out:csv';

const HEADER_MATCHERS: Record<CountryCategoryKey, RegExp> = {
  together: /together/i,
  amir: /amir/i,
  vlada: /vlada/i,
  separate: /separate/i,
  wish: /wish/i,
};

const FALLBACK_COUNTRY_GROUPS: CountryGroups = {
  together: ['Germany', 'Vietnam', 'Thailand', 'Malaysia', 'Argentina', 'Indonesia'],
  amir: ['Iran', 'Georgia', 'Japan', 'UAE', 'Qatar', 'Monaco', 'Vatican City'],
  vlada: [
    'China',
    'Ukraine',
    'Russia',
    'Canada',
    'United States',
    'Guatemala',
    'Morocco',
    'Spain',
    'Potugal',
    'UK',
    'Ireland',
    'Sweden',
    'Nepal',
    'Cambodia',
    'Hong Kong',
    'Laos',
  ],
  separate: ['France', 'Poland', 'Italy', 'Turkey', 'Singapore', 'South Korea'],
  wish: ['Iceland'],
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(value);
      value = '';
      continue;
    }

    value += char;
  }

  values.push(value);
  return values;
};

const parseCsv = (csv: string): string[][] =>
  csv
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine);

const cleanCountryValue = (value: string): string => value.trim();

const withDedupedValues = (groups: CountryGroups): CountryGroups => ({
  together: Array.from(new Set(groups.together.map(cleanCountryValue).filter(Boolean))),
  amir: Array.from(new Set(groups.amir.map(cleanCountryValue).filter(Boolean))),
  vlada: Array.from(new Set(groups.vlada.map(cleanCountryValue).filter(Boolean))),
  separate: Array.from(new Set(groups.separate.map(cleanCountryValue).filter(Boolean))),
  wish: Array.from(new Set(groups.wish.map(cleanCountryValue).filter(Boolean))),
});

const parseCountryGroups = (csv: string): CountryGroups => {
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return FALLBACK_COUNTRY_GROUPS;
  }

  const headers = rows[0].map((value) => value.trim());
  const categoryColumnIndex: Record<CountryCategoryKey, number> = {
    together: 0,
    amir: 1,
    vlada: 2,
    separate: 3,
    wish: 4,
  };

  for (const category of CATEGORY_KEYS) {
    const foundIndex = headers.findIndex((header) => HEADER_MATCHERS[category].test(header));
    if (foundIndex >= 0) {
      categoryColumnIndex[category] = foundIndex;
    }
  }

  const parsed: CountryGroups = {
    together: [],
    amir: [],
    vlada: [],
    separate: [],
    wish: [],
  };

  for (const row of rows.slice(1)) {
    for (const category of CATEGORY_KEYS) {
      const value = cleanCountryValue(row[categoryColumnIndex[category]] ?? '');
      if (value.length > 0) {
        parsed[category].push(value);
      }
    }
  }

  return withDedupedValues(parsed);
};

export const runtime = 'nodejs';

export async function GET() {
  try {
    const response = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Google Sheet fetch failed with status ${response.status}`);
    }

    const csv = await response.text();
    const countryGroups = parseCountryGroups(csv);

    return NextResponse.json({
      countryGroups,
      source: 'google-sheet',
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      countryGroups: FALLBACK_COUNTRY_GROUPS,
      source: 'fallback',
      updatedAt: new Date().toISOString(),
    });
  }
}
