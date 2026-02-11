const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const getPosterServiceBaseUrl = () => {
  const baseUrl = process.env.POSTER_SERVICE_BASE_URL;
  if (!baseUrl) {
    throw new Error('POSTER_SERVICE_BASE_URL is not configured.');
  }
  return normalizeBaseUrl(baseUrl);
};

const getPosterServiceToken = () => process.env.POSTER_SERVICE_TOKEN?.trim() ?? '';

export const toAbsolutePosterAssetUrl = (value: string | undefined | null) => {
  if (!value) {
    return undefined;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  const baseUrl = getPosterServiceBaseUrl();
  if (value.startsWith('/')) {
    return `${baseUrl}${value}`;
  }

  return `${baseUrl}/${value}`;
};

type PosterServiceFetchResult<T> = {
  payload: T;
  status: number;
};

export const posterServiceFetch = async <T>(
  path: string,
  init?: RequestInit
): Promise<PosterServiceFetchResult<T>> => {
  const baseUrl = getPosterServiceBaseUrl();
  const token = getPosterServiceToken();
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    cache: 'no-store',
    headers,
  });

  const text = await response.text();
  const payload = (text ? JSON.parse(text) : {}) as T;

  return {
    payload,
    status: response.status,
  };
};

