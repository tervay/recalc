import { cachedFetch } from 'scripts/ingest/retrieval/cachedFetch';

// Shared retry/backoff wrapper around the on-disk cached fetch. Only 200
// (exists) and 404 (absent) are definitive answers from a vendor's Shopify
// store; both are cached by cachedFetch. Anything else (429/430 rate-limit,
// 5xx) is transient - as are dropped connections. We retry those with
// backoff so a real request is never silently treated as a failure (and so
// the terminal response gets cached once it arrives).
export const TERMINAL_STATUSES = new Set([200, 404]);
export const MAX_ATTEMPTS = 6;
export const RETRY_BACKOFF_MS = 500;

// Politeness knob for callers spacing out real network requests. Cached
// responses should skip the delay, keeping reruns effectively instant.
export const NETWORK_SPACING_MS = 200;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface FetchWithRetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
}

/**
 * Computes the delay before the next retry attempt. Honors a numeric
 * `Retry-After` (seconds) header when the server sends one; otherwise backs
 * off exponentially from `backoffMs` with a little jitter to unbunch
 * concurrent retries.
 */
export function retryDelayMs(
  attempt: number,
  response?: Awaited<ReturnType<typeof cachedFetch>>,
  backoffMs: number = RETRY_BACKOFF_MS,
): number {
  const retryAfter = response?.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  }
  return backoffMs * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
}

/**
 * Fetches `url` through the shared cache, retrying transient failures
 * (dropped connections, 429/430 rate-limits, 5xx) with backoff. Resolves
 * only on a definitive 200/404; throws if every attempt is exhausted
 * without one.
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {},
): Promise<{ response: Awaited<ReturnType<typeof cachedFetch>> }> {
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const backoffMs = options.backoffMs ?? RETRY_BACKOFF_MS;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await cachedFetch(url);
      if (TERMINAL_STATUSES.has(response.status)) return { response };
      lastError = new Error(`HTTP ${response.status}`);
      if (attempt < maxAttempts) {
        console.log(
          `Got ${response.status} for ${url}, retrying in ${retryDelayMs(attempt, response, backoffMs)}ms`,
        );
        await sleep(retryDelayMs(attempt, response, backoffMs));
      }
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        console.log(
          `Got error for ${url}, retrying in ${retryDelayMs(attempt, undefined, backoffMs)}ms`,
        );
        await sleep(retryDelayMs(attempt, undefined, backoffMs));
      }
    }
  }
  throw lastError;
}
