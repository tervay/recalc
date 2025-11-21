import { z } from 'zod';

import { zVendor } from '~/lib/types/common';

export const zJSONBelt = z.object({
  teeth: z.number(),
  width: z.number().min(1), // mm
  profile: z.string(),
  pitch: z.number().min(1), // mm
  sku: z.string().nullable(),
  url: z.string().url(),
  vendor: zVendor,
});

export type JSONBelt = z.infer<typeof zJSONBelt>;

export const zWCPBelt = zJSONBelt;
export type WCPBelt = z.infer<typeof zWCPBelt>;

export function wcpBeltToJsonBelt(belt: WCPBelt): JSONBelt {
  return { ...belt, vendor: 'WCP' };
}

export const zAndyMarkBelt = z.object({
  teeth: z.number(),
  width: z.number().min(1), // (mm)
  profile: z.string(),
  pitch: z.number().min(1), // (mm)
  sku: z.string().nullable(),
  url: z.string().url(),
});
export type AndyMarkBelt = z.infer<typeof zAndyMarkBelt>;

export function andyMarkBeltToJsonBelt(belt: AndyMarkBelt): JSONBelt {
  return { ...belt, vendor: 'AndyMark' };
}
