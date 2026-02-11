import { NextResponse } from 'next/server';

import { POSTER_THEME_BY_ID, POSTER_THEME_IDS } from '@/data/maptoposter';
import { posterServiceFetch } from '@/lib/posterServiceServer';
import type { PosterThemeOption } from '@/types/poster';

const FALLBACK_THEMES: PosterThemeOption[] = POSTER_THEME_IDS.map((themeId) => ({
  id: themeId,
  name: POSTER_THEME_BY_ID[themeId].label,
  description: '',
}));

const normalizeTheme = (theme: Partial<PosterThemeOption>): PosterThemeOption => ({
  id: String(theme.id ?? ''),
  name: String(theme.name ?? theme.id ?? ''),
  description: typeof theme.description === 'string' ? theme.description : '',
});

export const runtime = 'nodejs';

export async function GET() {
  try {
    const serviceResponse = await posterServiceFetch<Partial<PosterThemeOption>[]>(
      '/v1/themes'
    );

    if (serviceResponse.status >= 400 || !Array.isArray(serviceResponse.payload)) {
      throw new Error('Theme fetch failed');
    }

    const themes = serviceResponse.payload
      .map(normalizeTheme)
      .filter((theme) => theme.id.length > 0);

    return NextResponse.json({
      source: 'poster-service',
      themes,
    });
  } catch {
    return NextResponse.json({
      source: 'fallback',
      themes: FALLBACK_THEMES,
    });
  }
}

