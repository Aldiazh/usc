import api from './api';

export const SHORT_CACHE_TTL = 30_000;
export const STATS_CACHE_TTL = 60_000;

const responseCache = new Map();
const NEVER_CACHE_PATTERNS = [
  /\/live-stats\b/,
  /\/heartbeat\b/,
  /\/status\b/,
  /\/answer\b/,
];

function shouldBypassCache(url) {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}

function normalizeParams(params = {}) {
  return Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key] ?? '')}`)
    .join('&');
}

function cacheKey(url, config = {}) {
  const params = normalizeParams(config.params || {});
  return params ? `${url}?${params}` : url;
}

export async function cachedGet(url, config = {}, ttlMs = SHORT_CACHE_TTL) {
  if (shouldBypassCache(url)) {
    return api.get(url, config);
  }

  const key = cacheKey(url, config);
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.response;
  }

  const response = await api.get(url, config);
  responseCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    response,
  });

  return response;
}

export function clearApiCache(prefix) {
  if (!prefix) {
    responseCache.clear();
    return;
  }

  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}
