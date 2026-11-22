import * as z from 'zod';

import { zBoreSchema, zVendorSchema } from '~/lib/types/common';

export const zBeltProfileSchema = z.enum(['GT2', 'HTD', 'RT25']);
export type BeltProfile = z.infer<typeof zBeltProfileSchema>;

export const zJSONPulleySchema = z.object({
  teeth: z.number(),
  width: z.number().min(1), // (mm)
  profile: z.string(),
  pitch: z.number().min(1), // (mm)
  sku: z.string().nullable(),
  variantId: z.number().nullable(),
  url: z.string().url(),
  bore: zBoreSchema,
  vendor: zVendorSchema,
});

export type JSONPulley = z.infer<typeof zJSONPulleySchema>;
