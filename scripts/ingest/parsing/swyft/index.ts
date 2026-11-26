import { parseSwyftBelts } from 'scripts/ingest/parsing/swyft/belts';
import { parseSwyftGears } from 'scripts/ingest/parsing/swyft/gears';
import { parseSwyftPulleys } from 'scripts/ingest/parsing/swyft/pulleys';
import { parseSwyftWheels } from 'scripts/ingest/parsing/swyft/wheels';
import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const swyftParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: parseSwyftPulleys,
  belts: parseSwyftBelts,
  sprockets: () => [],
  gears: parseSwyftGears,
  wheels: parseSwyftWheels,
};
