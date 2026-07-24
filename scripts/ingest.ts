import { program } from 'commander';
import { writeOutput } from 'scripts/ingest/output/index';
import { parseVendorProducts } from 'scripts/ingest/parsing';
import { PRODUCT_TYPES } from 'scripts/ingest/productTypes';
import type { ProductType } from 'scripts/ingest/productTypes';
import { retrieveVendor } from 'scripts/ingest/retrieval/index';
import {
  mergeStoreCacheEntries,
  readStoreCache,
  writeStoreCache,
} from 'scripts/ingest/storeCache/index';
import { validateParsedData } from 'scripts/ingest/validation/index';
import { INGESTION_VENDORS, isVendorName } from 'scripts/ingest/vendors';
import type { VendorName } from 'scripts/ingest/vendors';

async function runPipeline(
  vendor: VendorName,
  productTypes: ProductType[],
): Promise<void> {
  console.log(`\n=== ${vendor} ===`);

  // Step 1: Retrieval
  console.log('  Retrieving products...');
  const products = await retrieveVendor(vendor);
  console.log(`  Retrieved ${products.length} products`);

  // Step 2: Tracking (Store Cache)
  console.log('  Updating store cache...');
  const existingCache = await readStoreCache(vendor);
  const { merged, newEntries } = mergeStoreCacheEntries(
    existingCache,
    products,
    vendor,
  );
  await writeStoreCache(vendor, merged);
  if (newEntries.length > 0) {
    console.log(`  ${newEntries.length} new products detected`);
  }

  // Steps 3-5: Parse → Validate → Output per product type
  for (const productType of productTypes) {
    const parsed = parseVendorProducts(vendor, productType, products);
    const { valid, errors } = validateParsedData(productType, parsed);

    if (errors.length > 0) {
      console.error(`  ${errors.length} validation errors for ${productType}`);
      for (const e of errors) {
        console.error(`    [${e.index}]: ${e.error.message}`);
      }
    }

    const seen = new Set<string>();
    const deduped = valid.filter((item) => {
      const typed = item as { sku?: string | null; vendor?: string };
      const key =
        typed.sku && typed.vendor
          ? `${typed.vendor}:${typed.sku}`
          : JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const duplicateCount = valid.length - deduped.length;
    if (duplicateCount > 0) {
      console.warn(`  ${duplicateCount} duplicate ${productType} removed`);
    }

    await writeOutput(vendor, productType, deduped);
    if (deduped.length > 0) {
      console.log(`  ${deduped.length} ${productType} written`);
    }
  }
}

program
  .name('ingest')
  .description('Vendor product ingestion pipeline')
  .argument('<vendor>', 'Vendor name or "all"')
  .argument('[productType]', 'Product type or "all" (default: all)', 'all')
  .action(async (vendorArg: string, productTypeArg: string) => {
    try {
      // Resolve vendors
      const vendors: VendorName[] =
        vendorArg.toLowerCase() === 'all'
          ? [...INGESTION_VENDORS]
          : (() => {
              const match = INGESTION_VENDORS.find(
                (v) => v.toLowerCase() === vendorArg.toLowerCase(),
              );
              if (!match)
                throw new Error(
                  `Unknown vendor: ${vendorArg}. Valid: ${INGESTION_VENDORS.join(', ')}`,
                );
              return [match];
            })();

      // Resolve product types
      const productTypes: ProductType[] =
        productTypeArg.toLowerCase() === 'all'
          ? [...PRODUCT_TYPES]
          : (() => {
              const match = PRODUCT_TYPES.find(
                (pt) => pt === productTypeArg.toLowerCase(),
              );
              if (!match)
                throw new Error(
                  `Unknown product type: ${productTypeArg}. Valid: ${PRODUCT_TYPES.join(', ')}`,
                );
              return [match];
            })();

      for (const vendor of vendors) {
        await runPipeline(vendor, productTypes);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();

// Re-export for use in other scripts
export { isVendorName };
