import { SHOPIFY_DOMAINS } from '~/lib/stock';

export const INGESTION_VENDORS = [
  'WCP',
  'Swyft',
  'Thrifty',
  'VBeltGuys',
  'AndyMark',
  'LastAnvil',
  'SDS',
  'REV',
] as const;
export type VendorName = (typeof INGESTION_VENDORS)[number];

export function isVendorName(s: string): s is VendorName {
  return (INGESTION_VENDORS as readonly string[]).includes(s);
}

export const SHOPIFY_CONFIGS: Partial<
  Record<VendorName, { rootDomain: string }>
> = {
  WCP: { rootDomain: SHOPIFY_DOMAINS.WCP },
  Swyft: { rootDomain: SHOPIFY_DOMAINS.Swyft },
  Thrifty: { rootDomain: SHOPIFY_DOMAINS.Thrifty },
  VBeltGuys: { rootDomain: SHOPIFY_DOMAINS.VBeltGuys },
  AndyMark: { rootDomain: SHOPIFY_DOMAINS.AndyMark },
  LastAnvil: { rootDomain: SHOPIFY_DOMAINS.LastAnvil },
  SDS: { rootDomain: SHOPIFY_DOMAINS.SDS },
  // REV has no Shopify store
};

export function urlForHandle(
  handle: string,
  vendor: VendorName,
  variantId?: number | null,
): string {
  const config = SHOPIFY_CONFIGS[vendor];
  if (!config) throw new Error(`No Shopify config for vendor: ${vendor}`);
  const url = `${config.rootDomain}/products/${handle}`;
  if (variantId == null) return url;
  return `${url}?variant=${variantId}`;
}
