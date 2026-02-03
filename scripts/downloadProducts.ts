import { program } from 'commander';
import { alertUnparsedProducts } from 'scripts/downloadProducts/alert';
import {
  compareAndMerge,
  loadCache,
  saveCache,
} from 'scripts/downloadProducts/cache';
import { CONFIGS, downloadAllVendors } from 'scripts/downloadProducts/download';
import { generateAllOutputFiles } from 'scripts/downloadProducts/generate';
import { parseVendorBelts } from 'scripts/downloadProducts/parsers/belts';
import { parseVendorGears } from 'scripts/downloadProducts/parsers/gears';
import { parseVendorPlanetaries } from 'scripts/downloadProducts/parsers/planetaries';
import { parseVendorPulleys } from 'scripts/downloadProducts/parsers/pulleys';
import { parseVendorSprockets } from 'scripts/downloadProducts/parsers/sprockets';
import type {
  CacheEntry,
  ProductType,
  VendorCache,
  VendorName,
} from 'scripts/downloadProducts/types';

import type { ShopifyProduct } from '~/lib/types/shopify';

/**
 * Process a single vendor and product type
 */
async function processVendorProductType(
  vendor: VendorName,
  productType: ProductType,
  vendorProducts: Map<VendorName, ShopifyProduct[]>,
): Promise<{
  cache: VendorCache;
  newProducts: CacheEntry[];
}> {
  console.log(`\nProcessing ${vendor} - ${productType}...`);

  // Get products for this vendor
  const products = vendorProducts.get(vendor) ?? [];

  // Parse products based on product type
  let parsedEntries: CacheEntry[] = [];

  switch (productType) {
    case 'pulleys':
      parsedEntries = parseVendorPulleys(vendor, products);
      break;
    case 'belts':
      parsedEntries = parseVendorBelts(vendor, products);
      break;
    case 'sprockets':
      parsedEntries = parseVendorSprockets(vendor, products);
      break;
    case 'gears':
      parsedEntries = parseVendorGears(vendor, products);
      break;
    case 'planetaries':
      parsedEntries = parseVendorPlanetaries(vendor, products);
      break;
  }

  if (parsedEntries.length === 0) {
    console.log(`  No ${productType} found for ${vendor}`);
    return { cache: {}, newProducts: [] };
  }

  // Load existing cache
  const oldCache = await loadCache(vendor, productType);

  // Compare and merge
  const { merged, newProducts } = compareAndMerge(oldCache, parsedEntries);

  // Save updated cache
  await saveCache(vendor, productType, merged);

  console.log(`  Cached ${Object.keys(merged).length} ${productType}`);
  if (newProducts.length > 0) {
    console.log(`  Found ${newProducts.length} new ${productType}`);
  }

  return { cache: merged, newProducts };
}

/**
 * Process a single vendor for all product types
 */
async function processVendor(
  vendor: VendorName,
  vendorProducts: Map<VendorName, ShopifyProduct[]>,
): Promise<{
  caches: Map<string, VendorCache>;
}> {
  const productTypes: ProductType[] = [
    'pulleys',
    'belts',
    'sprockets',
    'gears',
    'planetaries',
  ];

  const caches = new Map<string, VendorCache>();

  for (const productType of productTypes) {
    const result = await processVendorProductType(
      vendor,
      productType,
      vendorProducts,
    );

    if (Object.keys(result.cache).length > 0) {
      caches.set(`${vendor}_${productType}`, result.cache);
    }
  }

  return { caches };
}

/**
 * Load vendor data from existing JSON files
 */
async function loadVendorData(
  vendors: VendorName[],
): Promise<Map<VendorName, ShopifyProduct[]>> {
  const { readFile } = await import('fs/promises');
  const { join } = await import('path');
  const vendorProducts = new Map<VendorName, ShopifyProduct[]>();

  for (const vendor of vendors) {
    try {
      const vendorFile = join(process.cwd(), 'vendors', `${vendor}.json`);
      const content = await readFile(vendorFile, 'utf-8');
      const products = JSON.parse(content) as ShopifyProduct[];
      vendorProducts.set(vendor, products);
      console.log(`Loaded ${products.length} products from ${vendor}.json`);
    } catch (error) {
      console.error(`Failed to load ${vendor}.json:`, error);
      vendorProducts.set(vendor, []);
    }
  }

  return vendorProducts;
}

/**
 * Main dispatch function
 */
async function dispatch(
  vendor: string,
  _productType: string,
  options: { skipDownload?: boolean },
): Promise<void> {
  const vendorLower = vendor.toLowerCase();

  console.log('='.repeat(60));
  console.log('ReCalc Product Download & Cache System');
  console.log('='.repeat(60));

  // Determine which vendors to process
  let vendorsToProcess: VendorName[];
  let includesREV = false;

  if (vendorLower === 'all') {
    vendorsToProcess = CONFIGS.map((c) => c.vendorName);
    // Add REV to the list since it's hardcoded
    vendorsToProcess.push('REV');
    includesREV = true;
  } else if (vendorLower === 'rev') {
    // REV has no Shopify store, products are hardcoded in parsers
    vendorsToProcess = ['REV'];
    includesREV = true;
  } else {
    const matchedVendor = CONFIGS.find(
      (c) => c.vendorName.toLowerCase() === vendorLower,
    );
    if (!matchedVendor) {
      throw new Error(`Unknown vendor: ${vendor}`);
    }
    vendorsToProcess = [matchedVendor.vendorName];
  }

  // Download or load vendor data (skip for REV and VBeltGuys)
  let vendorProducts: Map<VendorName, ShopifyProduct[]>;
  const vendorsNeedingData = vendorsToProcess.filter(
    (v) => v !== 'REV' && v !== 'VBeltGuys',
  );

  if (vendorsNeedingData.length > 0) {
    if (options.skipDownload) {
      console.log(
        '\n--- STAGE 1: Loading Vendor Data from Disk (--skip-download) ---',
      );
      vendorProducts = await loadVendorData(vendorsNeedingData);
    } else {
      console.log('\n--- STAGE 1: Downloading Vendor Data ---');
      vendorProducts = await downloadAllVendors(vendorsNeedingData);
    }
  } else {
    console.log(
      '\n--- STAGE 1: Skipping Data Download (REV and VBeltGuys products are handled specially) ---',
    );
    vendorProducts = new Map();
  }

  // Add empty data for REV if processing it (products are hardcoded in parsers)
  if (includesREV) {
    vendorProducts.set('REV', []);
  }

  // Add empty data for VBeltGuys if processing it (requires manual curation, too many products to download)
  if (vendorsToProcess.includes('VBeltGuys')) {
    vendorProducts.set('VBeltGuys', []);
  }

  // Process each vendor
  console.log('\n--- STAGE 2: Processing and Caching Products ---');
  const allCaches = new Map<string, VendorCache>();

  for (const v of vendorsToProcess) {
    const { caches } = await processVendor(v, vendorProducts);

    // Merge caches
    for (const [key, cache] of caches.entries()) {
      allCaches.set(key, cache);
    }
  }

  // Generate output files
  console.log('\n--- STAGE 3: Generating Output Files ---');
  await generateAllOutputFiles(allCaches);

  // Alert about unparsed relevant products
  console.log('\n--- STAGE 4: Unparsed Product Detection ---');
  alertUnparsedProducts(vendorProducts, allCaches);
}

program
  .name('download-products')
  .description('Download products from vendors and cache them')
  .argument('<vendor>', 'Vendor name (e.g. WCP, REV, AndyMark) or "all"')
  .argument(
    '<productType>',
    'Product type (e.g. belts, pulleys, sprockets, gears, planetaries) or "all"',
  )
  .option(
    '--skip-download',
    'Skip downloading vendor data and use existing vendor JSON files',
  )
  .action(
    async (
      vendor: string,
      productType: string,
      options: { skipDownload?: boolean },
    ) => {
      try {
        await dispatch(vendor, productType, options);
      } catch (error) {
        console.error('Error:', error);
        process.exit(1);
      }
    },
  );

program.parse();
