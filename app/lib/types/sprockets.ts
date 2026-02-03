import * as z from 'zod';

import { type Bore, zBoreSchema, zVendorSchema } from '~/lib/types/common';

const zChainTypeSchema = z.enum(['#25', '#35']);
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

export const zWCPSprocketBoreSchema = z.enum([
  '1/2" Hex Bore',
  'SplineXL Bore',
  '8mm Key Bore',
  '1/2\" Rounded Hex Bore',
  '8mm SplineXS Bore',
  'Falcon Bore',
  '1/2" ID',
  '3/8" Hex Bore',
]);
export type WCPSprocketBore = z.infer<typeof zWCPSprocketBoreSchema>;

export const zWCPSprocketSchema = z.object({
  teeth: z.number(),
  bore: zWCPSprocketBoreSchema,
  chainType: zChainTypeSchema,
  url: z.string().url(),
  sku: z.string().nullable(),
});

export type WCPSprocket = z.infer<typeof zWCPSprocketSchema>;

export function wcpSprocketToJsonSprocket(sprocket: WCPSprocket): JSONSprocket {
  const wcpBoreToJsonBore: Record<WCPSprocketBore, Bore> = {
    '1/2" Hex Bore': '1/2" Hex',
    'SplineXL Bore': 'SplineXL',
    '8mm Key Bore': '8mm',
    '1/2\" Rounded Hex Bore': '1/2" Hex',
    '8mm SplineXS Bore': 'SplineXS',
    'Falcon Bore': 'Falcon',
    '1/2" ID': '1/2" Hex',
    '3/8" Hex Bore': '3/8" Hex',
  };

  return {
    ...sprocket,
    bore: wcpBoreToJsonBore[sprocket.bore],
    vendor: 'WCP',
  };
}

export const zThriftySprocketBoreSchema = z.enum([
  '3/8\" Hex Bore',
  '1/2\" Hex Bore',
  '8mm Keyed Bore',
]);
export type ThriftySprocketBore = z.infer<typeof zThriftySprocketBoreSchema>;

export const zThriftySprocketSchema = z.object({
  teeth: z.number(),
  bore: zThriftySprocketBoreSchema,
  chainType: zChainTypeSchema,
  sku: z.string(),
  url: z.string().url(),
});

export type ThriftySprocket = z.infer<typeof zThriftySprocketSchema>;

export function thriftySprocketToJsonSprocket(
  sprocket: ThriftySprocket,
): JSONSprocket {
  const thriftyBoreToJsonBore: Record<ThriftySprocketBore, Bore> = {
    '3/8\" Hex Bore': '3/8" Hex',
    '1/2\" Hex Bore': '1/2" Hex',
    '8mm Keyed Bore': '8mm',
  };

  return {
    ...sprocket,
    bore: thriftyBoreToJsonBore[sprocket.bore],
    vendor: 'Thrifty',
  };
}
