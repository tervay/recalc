import { parseWCPBelts } from 'scripts/ingest/parsing/wcp/belts';
import { parseWCPGears } from 'scripts/ingest/parsing/wcp/gears';
import { parseWCPPulleys } from 'scripts/ingest/parsing/wcp/pulleys';
import { parseWCPSprockets } from 'scripts/ingest/parsing/wcp/sprockets';
import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const wcpParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: parseWCPPulleys,
  belts: parseWCPBelts,
  sprockets: parseWCPSprockets,
  gears: parseWCPGears,
};
