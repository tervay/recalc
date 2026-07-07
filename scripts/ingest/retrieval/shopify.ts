import { cachedFetch } from 'scripts/ingest/retrieval/cachedFetch';
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

  while (true) {
    const response = await cachedFetch(
      `${config.rootDomain}/products.json?page=${pageNum}&limit=250`,
    );
    const data = (await response.json()) as ShopifyResponse;
    if (data.products.length === 0) {
      break;
    }
    products.push(...data.products);
    pageNum++;
  }

  return products;
}
