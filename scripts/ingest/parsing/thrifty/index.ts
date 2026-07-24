import { parseThriftyBelts } from 'scripts/ingest/parsing/thrifty/belts';
import { parseThriftyPulleys } from 'scripts/ingest/parsing/thrifty/pulleys';
import { parseThriftySprockets } from 'scripts/ingest/parsing/thrifty/sprockets';
import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const thriftyParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: parseThriftyPulleys,
  belts: parseThriftyBelts,
  sprockets: parseThriftySprockets,
  gears: () => [],
};
