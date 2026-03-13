import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const vbeltguysParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: () => [],
  belts: () => [],
  sprockets: () => [],
  gears: () => [],
};
