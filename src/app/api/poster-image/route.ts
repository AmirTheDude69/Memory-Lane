import { NextResponse } from 'next/server';

import { MAP_TO_POSTER_ENTRIES } from '@/data/maptoposter';

const SOURCE_BASE_URL =
  'https://raw.githubusercontent.com/originalankur/maptoposter/main/posters';

const ALLOWED_FILES = new Set(MAP_TO_POSTER_ENTRIES.map((entry) => entry.file));

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file')?.trim() ?? '';

  if (!ALLOWED_FILES.has(file)) {
    return NextResponse.json({ error: 'Invalid poster file.' }, { status: 400 });
  }

  const sourceUrl = `${SOURCE_BASE_URL}/${encodeURIComponent(file)}`;

  const response = await fetch(sourceUrl, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok || !response.body) {
    return NextResponse.json({ error: 'Failed to load poster image.' }, { status: 502 });
  }

  return new Response(response.body, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': 'image/png',
    },
    status: 200,
  });
}
