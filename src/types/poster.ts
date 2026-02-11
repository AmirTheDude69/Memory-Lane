export type PosterJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type PosterJobKind = 'preview' | 'poster';

export type CreatePosterJobRequest = {
  city: string;
  country: string;
  theme: string;
  kind: PosterJobKind;
  distance?: number;
  width?: number;
  height?: number;
};

export type CreatePosterJobResponse = {
  jobId: string;
  status: PosterJobStatus;
  cacheKey: string;
  assetUrl?: string;
  previewUrl?: string;
  error?: string;
};

export type PosterJobStatusResponse = {
  jobId: string;
  status: PosterJobStatus;
  cacheKey: string;
  assetUrl?: string;
  previewUrl?: string;
  error?: string;
};

export type PosterThemeOption = {
  id: string;
  name: string;
  description?: string;
};

