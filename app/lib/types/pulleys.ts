import * as z from 'zod';

import { zBoreSchema, zVendorSchema } from '~/lib/types/common';

export const zJSONPulleySchema = z.object({
  teeth: z.number(),
  width: z.number().min(1), // (mm)
  profile: z.string(),
  pitch: z.number().min(1), // (mm)
  sku: z.string().nullable(),
  url: z.string().url(),
  bore: zBoreSchema,
  vendor: zVendorSchema,
});

export type JSONPulley = z.infer<typeof zJSONPulleySchema>;
