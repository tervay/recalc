import * as z from 'zod';

import { zBoreSchema, zVendorSchema } from '~/lib/types/common';

export const zJSONPlanetarySchema = z.object({
  slices: z.array(z.number().min(1).max(9)),
  maxSlices: z.number().min(1).max(3),
  inputBores: z.array(zBoreSchema),
  outputBores: z.array(zBoreSchema),
  sku: z.string(),
  url: z.url(),
  vendor: zVendorSchema,
});

export const zJSONPlanetaryInstanceSchema = z.object({
  slices: z.array(z.number().min(1).max(3)),
  ratio: z.number().min(1),
  inputBore: zBoreSchema,
  outputBore: zBoreSchema,
  sku: z.string(),
  url: z.url(),
  vendor: zVendorSchema,
});

export type JSONPlanetary = z.infer<typeof zJSONPlanetarySchema>;
export type JSONPlanetaryInstance = z.infer<
  typeof zJSONPlanetaryInstanceSchema
>;
