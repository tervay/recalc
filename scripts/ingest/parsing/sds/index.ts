import { parseSDSBelts } from 'scripts/ingest/parsing/sds/belts';
import { parseSDSGears } from 'scripts/ingest/parsing/sds/gears';
import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const sdsParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: () => [],
  belts: parseSDSBelts,
  sprockets: () => [],
  gears: parseSDSGears,
};
