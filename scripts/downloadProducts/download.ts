import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { FileSystemCache, NodeFetchCache } from 'node-fetch-cache';
import type { VendorName } from 'scripts/downloadProducts/types';

import type { ShopifyProduct, ShopifyResponse } from '~/lib/types/shopify';

export interface ShopifyConfig {
  vendorName: VendorName;
  rootDomain: string;
}

export const CONFIGS: ShopifyConfig[] = [
  {
    vendorName: 'WCP',
    rootDomain: 'https://wcproducts.com',
  },
  {
    vendorName: 'Swyft',
    rootDomain: 'https://swyftrobotics.com',
  },
  {
    vendorName: 'Thrifty',
    rootDomain: 'https://www.thethriftybot.com',
  },
  {
    vendorName: 'VBeltGuys',
    rootDomain: 'https://www.vbeltguys.com',
  },
  {
    vendorName: 'AndyMark',
    rootDomain: 'https://www.andymark.com',
  },
  {
    vendorName: 'LastAnvil',
    rootDomain: 'https://www.lastanvil.com',
  },
  {
    vendorName: 'SDS',
    rootDomain: 'https://www.swervedrivespecialties.com',
  },
];

const fetch = NodeFetchCache.create({
  cache: new FileSystemCache({
    cacheDirectory: join(process.cwd(), '.cache'),
  }),
  shouldCacheResponse: (response) => [200, 404].includes(response.status),
});

/**
 * Get all products from a vendor's Shopify store
 */
export async function getAllProducts(
  vendor: VendorName,
): Promise<ShopifyProduct[]> {
  const config = CONFIGS.find((c) => c.vendorName === vendor);
  if (!config) {
    throw new Error(`Config not found for vendor: ${vendor}`);
  }

  let pageNum = 1;
  const products: ShopifyProduct[] = [];

  while (true) {
    const response = await fetch(
      `${config.rootDomain}/products.json?page=${pageNum}&limit=250`,
    );
    const data = (await response.json()) as ShopifyResponse;
    if (data.products.length === 0) {
      break;
    }
    products.push(...data.products);
    pageNum++;
  }

  return products;
}

/**
 * Download all products from all vendors and save to vendors/ directory
 */
export async function downloadAllVendors(
  vendors?: VendorName[],
): Promise<Map<VendorName, ShopifyProduct[]>> {
  const vendorsToDownload = vendors ?? CONFIGS.map((c) => c.vendorName);
  const vendorDir = join(process.cwd(), 'vendors');
  await mkdir(vendorDir, { recursive: true });

  const results = new Map<VendorName, ShopifyProduct[]>();

  await Promise.all(
    vendorsToDownload.map(async (vendor) => {
      console.log(`Downloading products from ${vendor}...`);
      const products = await getAllProducts(vendor);
      results.set(vendor, products);

      // Save raw vendor JSON
      const vendorFile = join(vendorDir, `${vendor}.json`);
      await writeFile(vendorFile, JSON.stringify(products, null, 2) + '\n');
      console.log(
        `Saved ${products.length} products from ${vendor} to ${vendorFile}`,
      );
    }),
  );

  return results;
}

/**
 * Get URL for a product handle
 */
export function urlForHandle(handle: string, vendor: VendorName): string {
  const conf = CONFIGS.find((c) => c.vendorName === vendor);
  if (!conf) {
    throw new Error(`Config not found for vendor: ${vendor}`);
  }
  return `${conf.rootDomain}/products/${handle}`;
}
