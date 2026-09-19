const API_PATH_SUFFIX = '/api';

export const FALLBACK_API_BASE_URL = 'http://localhost:8000/api';
export const API_UNREACHABLE_MESSAGE =
  "Impossible de joindre l'API. Verifiez l'URL du backend.";

function isConfiguredApiUrl(candidate?: string | null): candidate is string {
  const normalized = candidate?.trim();
  return Boolean(normalized) && normalized !== 'undefined' && normalized !== 'null';
}

export function resolveApiBaseUrl(rawUrl?: string | null): string {
  const normalized = rawUrl?.trim().replace(/\/+$/, '');

  if (!normalized) {
    return FALLBACK_API_BASE_URL;
  }

  // Same-origin deployment (e.g. web build served by the API itself):
  // a relative value like "/api" is used as-is.
  if (normalized.startsWith('/')) {
    return normalized;
  }

  return normalized.endsWith(API_PATH_SUFFIX)
    ? normalized
    : `${normalized}${API_PATH_SUFFIX}`;
}

export function getApiBaseUrl(): string {
  const apiUrlCandidates = [
    process.env.EXPO_PUBLIC_BACKEND_URL,
    process.env.EXPO_PUBLIC_API_URL,
    process.env.API_URL,
  ];

  const configuredUrl =
    apiUrlCandidates.find((candidate) => isConfiguredApiUrl(candidate)) ?? null;

  return resolveApiBaseUrl(configuredUrl);
}
