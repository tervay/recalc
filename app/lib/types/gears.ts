import * as z from 'zod';

import { zBoreSchema, zVendorSchema } from '~/lib/types/common';

export const zJSONGearSchema = z.object({
  teeth: z.number().min(1),
  dp: z.number().min(1),
  bore: zBoreSchema,
  url: z.string().url(),
  sku: z.string().nullable(),
  vendor: zVendorSchema,
});

export type JSONGear = z.infer<typeof zJSONGearSchema>;
