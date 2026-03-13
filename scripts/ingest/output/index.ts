import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import type { ParsedProduct } from 'scripts/ingest/parsing';
import type { ProductType } from 'scripts/ingest/productTypes';
import type { VendorName } from 'scripts/ingest/vendors';

export async function writeOutput(
  vendor: VendorName,
  productType: ProductType,
  data: ParsedProduct[],
): Promise<void> {
  const outdir = join(process.cwd(), 'app/genData', vendor);
  await mkdir(outdir, { recursive: true });
  await writeFile(
    join(outdir, `${productType}.json`),
    JSON.stringify(data, null, 2) + '\n',
  );
}
