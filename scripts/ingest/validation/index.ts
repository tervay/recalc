import type { ProductType } from 'scripts/ingest/productTypes';
import * as z from 'zod';

import { zJSONBeltSchema } from '~/lib/types/belts';
import { zJSONGearSchema } from '~/lib/types/gears';
import { zJSONPulleySchema } from '~/lib/types/pulleys';
import { zJSONSprocketSchema } from '~/lib/types/sprockets';

const SCHEMAS: Record<ProductType, z.ZodSchema> = {
  pulleys: zJSONPulleySchema,
  belts: zJSONBeltSchema,
  sprockets: zJSONSprocketSchema,
  gears: zJSONGearSchema,
};

export function validateParsedData<T>(
  productType: ProductType,
  data: T[],
): { valid: T[]; errors: { index: number; error: z.ZodError }[] } {
  const schema = SCHEMAS[productType];
  const valid: T[] = [];
  const errors: { index: number; error: z.ZodError }[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = schema.safeParse(data[i]);
    if (result.success) {
      valid.push(result.data as T);
    } else {
      errors.push({ index: i, error: result.error });
    }
  }
  return { valid, errors };
}
