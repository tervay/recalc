import { andymarkParsers } from 'scripts/ingest/parsing/andymark/index';
import { lastanvilParsers } from 'scripts/ingest/parsing/lastanvil/index';
import { revParsers } from 'scripts/ingest/parsing/rev/index';
import { sdsParsers } from 'scripts/ingest/parsing/sds/index';
import { swyftParsers } from 'scripts/ingest/parsing/swyft/index';
import { thriftyParsers } from 'scripts/ingest/parsing/thrifty/index';
import { vbeltguysParsers } from 'scripts/ingest/parsing/vbeltguys/index';
import { wcpParsers } from 'scripts/ingest/parsing/wcp/index';
import type { ProductType } from 'scripts/ingest/productTypes';
import type { VendorName } from 'scripts/ingest/vendors';

import type { JSONBelt } from '~/lib/types/belts';
import type { JSONGear } from '~/lib/types/gears';
import type { JSONPulley } from '~/lib/types/pulleys';
import type { ShopifyProduct } from '~/lib/types/shopify';
import type { JSONSprocket } from '~/lib/types/sprockets';

export type ParsedProduct = JSONBelt | JSONPulley | JSONSprocket | JSONGear;

const VENDOR_PARSER_MAP: Record<
  VendorName,
  Record<ProductType, (products: ShopifyProduct[]) => unknown[]>
> = {
  WCP: wcpParsers,
  Thrifty: thriftyParsers,
  REV: revParsers,
  Swyft: swyftParsers,
  AndyMark: andymarkParsers,
  LastAnvil: lastanvilParsers,
  SDS: sdsParsers,
  VBeltGuys: vbeltguysParsers,
};

export function parseVendorProducts(
  vendor: VendorName,
  productType: ProductType,
  products: ShopifyProduct[],
): ParsedProduct[] {
  return VENDOR_PARSER_MAP[vendor][productType](products) as ParsedProduct[];
}
