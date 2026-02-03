import * as z from 'zod';

import { type Bore, zBoreSchema, zVendorSchema } from '~/lib/types/common';

export const zJSONGearSchema = z.object({
  teeth: z.number().min(1),
  dp: z.number().min(1),
  bore: zBoreSchema,
  url: z.string().url(),
  sku: z.string().nullable(),
  vendor: zVendorSchema,
});

export type JSONGear = z.infer<typeof zJSONGearSchema>;

export const zWCPGearBoreSchema = z.enum([
  'BAG Bore',
  'Falcon Bore',
  '1/2" Hex Bore',
  '3/8" Hex Bore',
  'Rounded Hex Bearing',
  '1/4" Round',
  'SplineXL Bore',
  '8mm SplineXS Bore',
  '8mm Key Bore',
  'RS550/775 Bore',
  '1/2" Rounded Hex Bore',
  'RS775 Bore',
  '8mm Round Bore',
  'Pinion Only',
] as const);
export type WCPGearBore = z.infer<typeof zWCPGearBoreSchema>;

export const zWCPGearSchema = z.object({
  teeth: z.number().min(1),
  dp: z.number().min(1),
  bore: zWCPGearBoreSchema,
  url: z.string().url(),
  sku: z.string().nullable(),
});
export type WCPGear = z.infer<typeof zWCPGearSchema>;

export function wcpGearToJsonGear(gear: WCPGear): JSONGear {
  const wcpBoreToJsonBore: Record<WCPGearBore, Bore> = {
    '1/2" Hex Bore': '1/2" Hex',
    'Falcon Bore': 'Falcon',
    'BAG Bore': 'BAG',
    'Rounded Hex Bearing': '1.125" Round',
    '3/8" Hex Bore': '3/8" Hex',
    '1/4" Round': '1/4" Round',
    'SplineXL Bore': 'SplineXL',
    '8mm SplineXS Bore': 'SplineXS',
    '8mm Key Bore': '8mm',
    'RS550/775 Bore': 'RS550',
    '1/2" Rounded Hex Bore': '1/2" Hex',
    'RS775 Bore': 'RS775',
    '8mm Round Bore': '8mm',
    'Pinion Only': '8mm',
  };

  return { ...gear, bore: wcpBoreToJsonBore[gear.bore], vendor: 'WCP' };
}
