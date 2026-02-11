import { NextResponse } from 'next/server';

import {
  posterServiceFetch,
  toAbsolutePosterAssetUrl,
} from '@/lib/posterServiceServer';
import type { PosterJobStatusResponse } from '@/types/poster';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

const buildFilename = (city: string, country: string, theme: string) => {
  const safe = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${safe(city)}_${safe(country)}_${safe(theme)}_poster.png`;
};

export async function GET(request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });
  }

  try {
    const jobResponse = await posterServiceFetch<Partial<PosterJobStatusResponse>>(
      `/v1/jobs/${encodeURIComponent(jobId)}`
    );
    if (jobResponse.status >= 400) {
      return NextResponse.json(
        { error: 'Poster job could not be loaded.' },
        { status: jobResponse.status }
      );
    }

    const assetUrl = toAbsolutePosterAssetUrl(jobResponse.payload.assetUrl);
    if (!assetUrl) {
      return NextResponse.json(
        { error: 'Poster is not ready yet.' },
        { status: 409 }
      );
    }

    const imageResponse = await fetch(assetUrl, { cache: 'no-store' });
    if (!imageResponse.ok || !imageResponse.body) {
      return NextResponse.json(
        { error: 'Could not fetch generated poster.' },
        { status: 502 }
      );
    }

    const params = new URL(request.url).searchParams;
    const city = params.get('city') ?? 'city';
    const country = params.get('country') ?? 'country';
    const theme = params.get('theme') ?? 'theme';
    const filename = buildFilename(city, country, theme);

    return new Response(imageResponse.body, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': imageResponse.headers.get('content-type') ?? 'image/png',
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: 'Poster service is unavailable right now.' },
      { status: 502 }
    );
  }
}

