import { fetchShopifyProducts } from 'scripts/ingest/retrieval/shopify';
import { fetchVBeltGuysProducts } from 'scripts/ingest/retrieval/vbeltguys';
import type { VendorName } from 'scripts/ingest/vendors';

import type { ShopifyProduct } from '~/lib/types/shopify';

export async function retrieveVendor(
  vendor: VendorName,
): Promise<ShopifyProduct[]> {
  if (vendor === 'REV') return [];
  if (vendor === 'VBeltGuys') return fetchVBeltGuysProducts();
  return fetchShopifyProducts(vendor);
}

export async function retrieveAllVendors(
  vendors: VendorName[],
): Promise<Map<VendorName, ShopifyProduct[]>> {
  const results = new Map<VendorName, ShopifyProduct[]>();
  await Promise.all(
    vendors.map(async (vendor) => {
      const products = await retrieveVendor(vendor);
      results.set(vendor, products);
    }),
  );
  return results;
}
