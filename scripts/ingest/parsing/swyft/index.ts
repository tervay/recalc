import { parseSwyftBelts } from 'scripts/ingest/parsing/swyft/belts';
import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const swyftParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: () => [],
  belts: parseSwyftBelts,
  sprockets: () => [],
  gears: () => [],
};
