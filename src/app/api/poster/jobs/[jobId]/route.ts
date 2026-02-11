import { NextResponse } from 'next/server';

import {
  posterServiceFetch,
  toAbsolutePosterAssetUrl,
} from '@/lib/posterServiceServer';
import type { PosterJobStatus, PosterJobStatusResponse } from '@/types/poster';

const VALID_STATUSES: PosterJobStatus[] = ['queued', 'running', 'completed', 'failed'];

const isPosterJobStatus = (value: string): value is PosterJobStatus =>
  VALID_STATUSES.includes(value as PosterJobStatus);

const normalizeResponse = (
  payload: Partial<PosterJobStatusResponse>
): PosterJobStatusResponse => ({
  jobId: String(payload.jobId ?? ''),
  status: isPosterJobStatus(String(payload.status ?? '')) ? (payload.status as PosterJobStatus) : 'failed',
  cacheKey: String(payload.cacheKey ?? ''),
  assetUrl: toAbsolutePosterAssetUrl(payload.assetUrl),
  previewUrl: toAbsolutePosterAssetUrl(payload.previewUrl),
  error: typeof payload.error === 'string' ? payload.error : undefined,
});

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });
  }

  try {
    const serviceResponse = await posterServiceFetch<Partial<PosterJobStatusResponse>>(
      `/v1/jobs/${encodeURIComponent(jobId)}`
    );
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

