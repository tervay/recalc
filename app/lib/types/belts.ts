import * as z from 'zod';

import { zVendorSchema } from '~/lib/types/common';

export const zJSONBeltSchema = z.object({
  teeth: z.number(),
  width: z.number().min(1), // mm
  profile: z.string(),
  pitch: z.number().min(1), // mm
  sku: z.string().nullable(),
  url: z.string().url(),
  vendor: zVendorSchema,
});

export type JSONBelt = z.infer<typeof zJSONBeltSchema>;

export const zWCPBeltSchema = zJSONBeltSchema;
export type WCPBelt = z.infer<typeof zWCPBeltSchema>;

export function wcpBeltToJsonBelt(belt: WCPBelt): JSONBelt {
  return { ...belt, vendor: 'WCP' };
}

export const zAndyMarkBeltSchema = z.object({
  teeth: z.number(),
  width: z.number().min(1), // (mm)
  profile: z.string(),
  pitch: z.number().min(1), // (mm)
  sku: z.string().nullable(),
  url: z.string().url(),
});
export type AndyMarkBelt = z.infer<typeof zAndyMarkBeltSchema>;

export function andyMarkBeltToJsonBelt(belt: AndyMarkBelt): JSONBelt {
  return { ...belt, vendor: 'AndyMark' };
}
