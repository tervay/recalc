import { parseLastAnvilBelts } from 'scripts/ingest/parsing/lastanvil/belts';
import { parseLastAnvilPulleys } from 'scripts/ingest/parsing/lastanvil/pulleys';
import { parseLastAnvilSprockets } from 'scripts/ingest/parsing/lastanvil/sprockets';
import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const lastanvilParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: parseLastAnvilPulleys,
  belts: parseLastAnvilBelts,
  sprockets: (_products: ShopifyProduct[]) => parseLastAnvilSprockets(),
  gears: () => [],
};
