import { parseREVBelts } from 'scripts/ingest/parsing/rev/belts';
import { parseREVGears } from 'scripts/ingest/parsing/rev/gears';
import { parseREVPulleys } from 'scripts/ingest/parsing/rev/pulleys';
import { parseREVSprockets } from 'scripts/ingest/parsing/rev/sprockets';
import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const revParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: (_products: ShopifyProduct[]) => parseREVPulleys(),
  belts: (_products: ShopifyProduct[]) => parseREVBelts(),
  sprockets: (_products: ShopifyProduct[]) => parseREVSprockets(),
  gears: (_products: ShopifyProduct[]) => parseREVGears(),
};
