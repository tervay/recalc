import {
  fetchWithRetry,
  NETWORK_SPACING_MS,
  sleep,
} from 'scripts/ingest/retrieval/fetchWithRetry';
import type { VendorName } from 'scripts/ingest/vendors';
import { SHOPIFY_CONFIGS } from 'scripts/ingest/vendors';

import type { ShopifyProduct, ShopifyResponse } from '~/lib/types/shopify';

export async function fetchShopifyProducts(
  vendor: VendorName,
): Promise<ShopifyProduct[]> {
  const config = SHOPIFY_CONFIGS[vendor];
  if (!config) {
    throw new Error(`No Shopify config for vendor: ${vendor}`);
  }

  let pageNum = 1;
  const products: ShopifyProduct[] = [];

  for (;;) {
    const url = `${config.rootDomain}/products.json?page=${pageNum}&limit=250`;

    let response: Awaited<ReturnType<typeof fetchWithRetry>>['response'];
    try {
      ({ response } = await fetchWithRetry(url));
    } catch (error) {
      // fetchWithRetry already exhausted its own backoff/retry budget (e.g.
      // persistent 429 rate-limiting or 5xx); surface which vendor/page
      // failed rather than the earlier opaque JSON-parse crash.
      throw new Error(
        `Failed to fetch ${vendor} products page ${pageNum}: ${String(error)}`,
        { cause: error },
      );
    }

    if (response.status !== 200) {
      // A definitive-but-non-200 terminal response (404) - no more pages.
      throw new Error(
        `Failed to fetch ${vendor} products page ${pageNum}: HTTP ${response.status}`,
      );
    }

    // Space out only genuine network requests; cache hits are free.
    if (response.isCacheMiss) await sleep(NETWORK_SPACING_MS);

    const data = (await response.json()) as ShopifyResponse;
    if (data.products.length === 0) {
      break;
    }
    products.push(...data.products);
    pageNum++;
  }

  return products;
}
