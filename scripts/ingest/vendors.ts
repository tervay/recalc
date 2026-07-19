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
  WCP: { rootDomain: 'https://wcproducts.com' },
  Swyft: { rootDomain: 'https://shop.swyftrobotics.com' },
  Thrifty: { rootDomain: 'https://www.thethriftybot.com' },
  VBeltGuys: { rootDomain: 'https://www.vbeltguys.com' },
  AndyMark: { rootDomain: 'https://www.andymark.com' },
  LastAnvil: { rootDomain: 'https://www.lastanvil.com' },
  SDS: { rootDomain: 'https://www.swervedrivespecialties.com' },
  // REV has no Shopify store
};

export function urlForHandle(handle: string, vendor: VendorName): string {
  const config = SHOPIFY_CONFIGS[vendor];
  if (!config) throw new Error(`No Shopify config for vendor: ${vendor}`);
  return `${config.rootDomain}/products/${handle}`;
}
