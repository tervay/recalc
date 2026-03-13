import * as z from 'zod';

import { zBoreSchema, zVendorSchema } from '~/lib/types/common';

export const zChainTypeSchema = z.enum(['#25', '#35']);
export type ChainType = z.infer<typeof zChainTypeSchema>;

export const zJSONSprocketSchema = z.object({
  teeth: z.number(),
  bore: zBoreSchema,
  chainType: zChainTypeSchema,
  url: z.string().url(),
  sku: z.string().nullable(),
  vendor: zVendorSchema,
});

export type JSONSprocket = z.infer<typeof zJSONSprocketSchema>;
