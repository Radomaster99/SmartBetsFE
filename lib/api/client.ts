const BASE_URL =
  process.env.SMARTBETS_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://tn1ij0gjz51y40mkc99bo5ja.178.104.173.167.sslip.io';
const API_KEY = process.env.API_KEY ?? '';
const AUTH_SKEW_MS = 60_000;

export interface JwtTokenResponseDto {
  accessToken: string | null;
  tokenType: string | null;
  expiresAtUtc: string;
  expiresInSeconds: number;
  issuer?: string | null;
  audience?: string | null;
}

let cachedJwtToken: JwtTokenResponseDto | null = null;
let jwtTokenPromise: Promise<JwtTokenResponseDto> | null = null;

function isJwtTokenValid(token: JwtTokenResponseDto | null): token is JwtTokenResponseDto {
  if (!token?.accessToken) {
    return false;
  }

  const expiresAt = new Date(token.expiresAtUtc).getTime();
  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt - AUTH_SKEW_MS > Date.now();
}

async function fetchJwtToken(): Promise<JwtTokenResponseDto> {
  const res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  const token = (await res.json()) as JwtTokenResponseDto;
  if (!token.accessToken) {
    throw new Error('API 500: JWT token response did not include accessToken');
  }

  cachedJwtToken = token;
  return token;
}

export async function getJwtToken(forceRefresh = false): Promise<JwtTokenResponseDto> {
  if (!forceRefresh && isJwtTokenValid(cachedJwtToken)) {
    return cachedJwtToken;
  }

  if (!jwtTokenPromise) {
    jwtTokenPromise = fetchJwtToken().finally(() => {
      jwtTokenPromise = null;
    });
  }

  return jwtTokenPromise;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const hasBody = options?.body !== undefined && options?.body !== null;
  const res = await fetch(url, {
    ...options,
    headers: {
      'X-API-KEY': API_KEY,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(options?.headers ?? {}),
    },
    signal: AbortSignal.timeout(85_000),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function apiFetchWithJwt<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getJwtToken();
  const url = `${BASE_URL}${path}`;
  const hasBody = options?.body !== undefined && options?.body !== null;

  const makeRequest = async (accessToken: string) =>
    fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(options?.headers ?? {}),
      },
      next: { revalidate: 0 },
      cache: 'no-store',
    });

  let res = await makeRequest(token.accessToken as string);

  if (res.status === 401) {
    const refreshed = await getJwtToken(true);
    res = await makeRequest(refreshed.accessToken as string);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      qs.set(k, String(v));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}
