import { parseVBeltGuysBelts } from 'scripts/ingest/parsing/vbeltguys/belts';
import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const vbeltguysParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: () => [],
  belts: parseVBeltGuysBelts,
  sprockets: () => [],
  gears: () => [],
};
