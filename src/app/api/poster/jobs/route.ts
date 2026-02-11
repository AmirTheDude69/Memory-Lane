import { NextResponse } from 'next/server';

import {
  posterServiceFetch,
  toAbsolutePosterAssetUrl,
} from '@/lib/posterServiceServer';
import type {
  CreatePosterJobRequest,
  CreatePosterJobResponse,
  PosterJobStatus,
} from '@/types/poster';

const VALID_STATUSES: PosterJobStatus[] = ['queued', 'running', 'completed', 'failed'];

const isPosterJobStatus = (value: string): value is PosterJobStatus =>
  VALID_STATUSES.includes(value as PosterJobStatus);

const normalizeResponse = (payload: Partial<CreatePosterJobResponse>): CreatePosterJobResponse => ({
  jobId: String(payload.jobId ?? ''),
  status: isPosterJobStatus(String(payload.status ?? '')) ? (payload.status as PosterJobStatus) : 'failed',
  cacheKey: String(payload.cacheKey ?? ''),
  assetUrl: toAbsolutePosterAssetUrl(payload.assetUrl),
  previewUrl: toAbsolutePosterAssetUrl(payload.previewUrl),
  error: typeof payload.error === 'string' ? payload.error : undefined,
});

const sanitizeRequest = (payload: Partial<CreatePosterJobRequest>): CreatePosterJobRequest | null => {
  const city = payload.city?.trim() ?? '';
  const country = payload.country?.trim() ?? '';
  const theme = payload.theme?.trim().toLowerCase() ?? '';
  const kind = payload.kind;
  if (!city || !country || !theme) {
    return null;
  }
  if (kind !== 'preview' && kind !== 'poster') {
    return null;
  }
  return {
    city,
    country,
    theme,
    kind,
  };
};

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let incoming: Partial<CreatePosterJobRequest>;
  try {
    incoming = (await request.json()) as Partial<CreatePosterJobRequest>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const payload = sanitizeRequest(incoming);
  if (!payload) {
    return NextResponse.json(
      { error: 'city, country, theme, and kind are required.' },
      { status: 400 }
    );
  }

  try {
    const serviceResponse = await posterServiceFetch<Partial<CreatePosterJobResponse>>('/v1/jobs', {
      body: JSON.stringify(payload),
      method: 'POST',
    });

    return NextResponse.json(normalizeResponse(serviceResponse.payload), {
      status: serviceResponse.status,
    });
  } catch {
    return NextResponse.json(
      { error: 'Poster service is unavailable right now.' },
      { status: 502 }
    );
  }
}

