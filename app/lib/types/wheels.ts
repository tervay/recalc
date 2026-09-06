import * as z from 'zod';

import { zBoreSchema, zVendorSchema } from '~/lib/types/common';

export const WHEEL_ONLY_BORES = [
  '7mm Hex',
  '14mm Hex',
  '1.25" Round',
  'Nub Bore',
  'AndyMark Hub',
] as const;
export type WheelOnlyBore = (typeof WHEEL_ONLY_BORES)[number];

export const zWheelBoreSchema = z.enum([
  ...zBoreSchema.options,
  ...WHEEL_ONLY_BORES,
]);
export type WheelBore = z.infer<typeof zWheelBoreSchema>;

export function compareWheelBores(a: WheelBore, b: WheelBore): number {
  const aIsMetric = a.includes('mm');
  const bIsMetric = b.includes('mm');
  if (aIsMetric !== bIsMetric) return aIsMetric ? 1 : -1;
  return a.localeCompare(b);
}

export const WHEEL_TYPES = [
  'Flex',
  'Compliant',
  'Grip',
  'Traction',
  'Omni',
  'Mecanum',
  'Pneumatic',
  'Billet',
] as const;
export const zWheelTypeSchema = z.enum(WHEEL_TYPES);
export type WheelType = z.infer<typeof zWheelTypeSchema>;

export const zJSONWheelSchema = z.object({
  name: z.string().min(1),
  diameter: z.number().min(1),
  bore: zWheelBoreSchema,
  type: zWheelTypeSchema,
  durometer: z.string().nullable(),
  url: z.string().url(),
  sku: z.string().nullable(),
  vendor: zVendorSchema,
});

export type JSONWheel = z.infer<typeof zJSONWheelSchema>;
