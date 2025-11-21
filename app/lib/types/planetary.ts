import { z } from 'zod';

import { zBore, zVendor } from '~/lib/types/common';

export const zJSONPlanetary = z.object({
  slices: z.array(z.number().min(1).max(9)),
  maxSlices: z.number().min(1).max(3),
  inputBores: z.array(zBore),
  outputBores: z.array(zBore),
  sku: z.string(),
  url: z.url(),
  vendor: zVendor,
});

export const zJSONPlanetaryInstance = z.object({
  slices: z.array(z.number().min(1).max(3)),
  ratio: z.number().min(1),
  inputBore: zBore,
  outputBore: zBore,
  sku: z.string(),
  url: z.url(),
  vendor: zVendor,
});

export type JSONPlanetary = z.infer<typeof zJSONPlanetary>;
export type JSONPlanetaryInstance = z.infer<typeof zJSONPlanetaryInstance>;
