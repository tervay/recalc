import pLimit from 'p-limit';
import { cachedFetch } from 'scripts/ingest/retrieval/cachedFetch';
import { SHOPIFY_CONFIGS } from 'scripts/ingest/vendors';

import type { ShopifyProduct } from '~/lib/types/shopify';

// VBeltGuys runs a Shopify store orders of magnitude larger than any other
// vendor we ingest, so crawling /products.json is impractical. Their belt
// handles are fully deterministic, so instead we enumerate candidate handles
// and probe each product's `.json` endpoint (HTTP 200 with product data if it
// exists, 404 otherwise). node-fetch-cache caches both, so reruns are free.
const TEETH_MIN = 20;
const TEETH_MAX = 1000;
const PITCHES = [3, 5] as const;
const WIDTHS = [9, 15] as const;

// Politeness: at most CONCURRENCY probes in flight, and each real network
// request is followed by NETWORK_SPACING_MS of quiet before that worker moves
// on. Cached responses skip the delay, keeping reruns effectively instant.
const CONCURRENCY = 4;
const NETWORK_SPACING_MS = 200;

// Only 200 (exists) and 404 (absent) are definitive answers; both are cached by
// the shared fetch. Anything else (429 rate-limit, 5xx) is transient — as are
// dropped connections. We retry those in-run with backoff so a real belt is
// never silently missed as a false negative (and so it gets cached once).
const TERMINAL_STATUSES = new Set([200, 404]);
const MAX_ATTEMPTS = 6;
const RETRY_BACKOFF_MS = 500;

const pad2 = (n: number): string => String(n).padStart(2, '0');
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function retryDelayMs(
  attempt: number,
  response?: Awaited<ReturnType<typeof cachedFetch>>,
): number {
  // Honor Retry-After (seconds) when the server sends it; otherwise back off
  // exponentially with a little jitter to unbunch concurrent retries.
  const retryAfter = response?.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  }
  return (
    RETRY_BACKOFF_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 250)
  );
}

/**
 * Fetches `url` through the shared cache, retrying transient failures (dropped
 * connections, 429s, 5xx) with backoff. Resolves only on a definitive 200/404;
 * throws if every attempt is exhausted without one.
 */
async function fetchWithRetry(
  url: string,
): Promise<{ response: Awaited<ReturnType<typeof cachedFetch>> }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await cachedFetch(url);
      if (TERMINAL_STATUSES.has(response.status)) return { response };
      lastError = new Error(`HTTP ${response.status}`);
      if (attempt < MAX_ATTEMPTS) await sleep(retryDelayMs(attempt, response));
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await sleep(retryDelayMs(attempt));
    }
  }
  throw lastError;
}

/**
 * Deterministic set of candidate belt handles:
 *   `${pitch * teeth}-${pitch}m-${pad2(width)}-synchronous-timing-belt`
 * for teeth in [TEETH_MIN, TEETH_MAX] x PITCHES x WIDTHS. Pure (no I/O).
 */
export function vbeltguysBeltHandles(): string[] {
  const handles: string[] = [];
  for (let teeth = TEETH_MIN; teeth <= TEETH_MAX; teeth++) {
    for (const pitch of PITCHES) {
      for (const width of WIDTHS) {
        const length = pitch * teeth;
        handles.push(
          `${length}-${pitch}m-${pad2(width)}-synchronous-timing-belt`,
        );
      }
    }
  }
  return handles;
}

export async function fetchVBeltGuysProducts(): Promise<ShopifyProduct[]> {
  const config = SHOPIFY_CONFIGS.VBeltGuys;
  if (!config) {
    throw new Error('No Shopify config for vendor: VBeltGuys');
  }

  const handles = vbeltguysBeltHandles();
  const limit = pLimit(CONCURRENCY);
  const products: ShopifyProduct[] = [];
  let checked = 0;

  await Promise.all(
    handles.map((handle) =>
      limit(async () => {
        const url = `${config.rootDomain}/products/${handle}.json`;

        let wasNetwork = false;
        try {
          const { response } = await fetchWithRetry(url);
          wasNetwork = response.isCacheMiss;

          if (response.status === 200) {
            const data = (await response.json()) as {
              product?: ShopifyProduct;
            };
            if (data.product && typeof data.product.handle === 'string') {
              products.push(data.product);
            }
          }
        } catch (error) {
          console.warn(`  ! request failed for ${handle}: ${String(error)}`);
        }

        // Space out only genuine network requests; cache hits are free.
        if (wasNetwork) await sleep(NETWORK_SPACING_MS);

        checked++;
        if (checked % 250 === 0) {
          console.log(
            `  checked ${checked}/${handles.length}, found ${products.length}`,
          );
        }
      }),
    ),
  );

  console.log(
    `  found ${products.length} belts across ${handles.length} candidates`,
  );
  return products;
}
