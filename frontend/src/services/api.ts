// api.ts — Typed backend API client.
//
// Three layers:
//   1. queryBackend()     → POST /query  (unified voice-query entry point)
//   2. Direct feature calls → POST /crop/recommend, /market/price, /scheme/match
//      (used for testing without needing STT)
//   3. testConnection()   → GET /health  (for startup connectivity check)
//
// All functions share the same error surface: NetworkError | APIError.

import { API_BASE_URL, LanguageCode } from '../utils/constants';
import {
  QueryResponse, CropResponse, MarketResponse, SchemeResponse,
} from '../context/AppContext';

// Error types

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class APIError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

// Shared fetch helper

const REQUEST_TIMEOUT_MS = 12_000; // 12s — accounts for slow rural 2G/3G connections

async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : {},
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new APIError(
        body?.voice_message ?? body?.detail ?? `Server error ${res.status}`,
        res.status
      );
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof APIError) throw err;
    // AbortError (timeout) or TypeError (no network at all)
    throw new NetworkError(
      'No network connection. Check your internet and try again.'
    );
  }
}

// 1. Unified voice query

export type QueryPayload = {
  transcript: string;
  language_code: LanguageCode;
  stt_confidence?: number;
  location?: { state: string; district: string };
};

export async function queryBackend(payload: QueryPayload): Promise<QueryResponse> {
  return apiFetch<QueryResponse>('/query', { method: 'POST', body: payload });
}

// 2. Direct feature calls (bypass intent layer — useful for testing)

export type DirectCropPayload = {
  soil_type: string;
  district: string;
  state: string;
  language_code: LanguageCode;
  forecast_override?: Array<{
    date: string; temp_max_c: number; temp_min_c: number;
    rainfall_mm: number; humidity_pct: number;
  }>;
};

export async function cropRecommend(payload: DirectCropPayload): Promise<CropResponse> {
  return apiFetch<CropResponse>('/crop/recommend', { method: 'POST', body: payload });
}

export type DirectMarketPayload = {
  crop_name: string;
  district: string;
  state: string;
  language_code: LanguageCode;
};

export async function marketPrice(payload: DirectMarketPayload): Promise<MarketResponse> {
  return apiFetch<MarketResponse>('/market/price', { method: 'POST', body: payload });
}

export type DirectSchemePayload = {
  state: string;
  farmer_type: 'small' | 'marginal' | 'tenant';
  crop?: string;
  language_code: LanguageCode;
};

export async function schemeMatch(payload: DirectSchemePayload): Promise<SchemeResponse> {
  return apiFetch<SchemeResponse>('/scheme/match', { method: 'POST', body: payload });
}

// 3. Health / connectivity check

export type HealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  dependencies: Record<string, { status: string; latency_ms: number | null; detail: string | null }>;
};

export async function testConnection(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health');
}

// Lightweight ping — just tells us if backend is reachable at all
export async function pingBackend(): Promise<boolean> {
  try {
    const health = await testConnection();
    return health.status !== 'unhealthy';
  } catch {
    return false;
  }
}
