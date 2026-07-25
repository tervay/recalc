import { parseAndyMarkBelts } from 'scripts/ingest/parsing/andymark/belts';
import { parseAndyMarkGears } from 'scripts/ingest/parsing/andymark/gears';
import { parseAndyMarkPulleys } from 'scripts/ingest/parsing/andymark/pulleys';
import { parseAndyMarkSprockets } from 'scripts/ingest/parsing/andymark/sprockets';
import type { ProductType } from 'scripts/ingest/productTypes';

import type { ShopifyProduct } from '~/lib/types/shopify';

export const andymarkParsers: Record<
  ProductType,
  (products: ShopifyProduct[]) => unknown[]
> = {
  pulleys: parseAndyMarkPulleys,
  belts: parseAndyMarkBelts,
  sprockets: parseAndyMarkSprockets,
  gears: parseAndyMarkGears,
};
