import { readFile } from 'fs/promises';
import { join } from 'path';

import type { StoreCacheEntry } from 'scripts/ingest/storeCache/types';
import type { VendorName } from 'scripts/ingest/vendors';
import { parse } from 'yaml';

export async function readStoreCache(
  vendor: VendorName,
): Promise<StoreCacheEntry[]> {
  const filePath = join(process.cwd(), 'vendors', `${vendor}.yaml`);
  try {
    const content = await readFile(filePath, 'utf-8');
    return (parse(content) as StoreCacheEntry[]) ?? [];
  } catch {
    return [];
  }
}
