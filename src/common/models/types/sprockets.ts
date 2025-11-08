import { z } from 'zod';

import { type Bore, zBore } from './common';
import type { MeasurementDict } from '../Measurement';

const zChainType = z.enum(['#25', '#35']);
export type ChainType = z.infer<typeof zChainType>;

export type SprocketDict = {
  readonly teeth: number;
  readonly pitch: MeasurementDict;
};

export const zJSONSprocket = z.object({
  teeth: z.number(),
  bore: zBore,
  chainType: zChainType,
  url: z.string().url(),
  sku: z.string().nullable(),
  vendor: z.string(),
});

export type JSONSprocket = z.infer<typeof zJSONSprocket>;

export const zWCPSprocketBore = z.enum([
  '1/2" Hex Bore',
  'SplineXL Bore',
  '8mm Key Bore',
  '1/2\" Rounded Hex Bore',
  '8mm SplineXS Bore',
  'Falcon Bore',
  '1/2" ID',
  '3/8" Hex Bore',
]);
export type WCPSprocketBore = z.infer<typeof zWCPSprocketBore>;

export const zWCPSprocket = z.object({
  teeth: z.number(),
  bore: zWCPSprocketBore,
  chainType: zChainType,
  url: z.string().url(),
  sku: z.string().nullable(),
});

export type WCPSprocket = z.infer<typeof zWCPSprocket>;

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

export const zThriftySprocketBore = z.enum([
  '3/8\" Hex Bore',
  '1/2\" Hex Bore',
  '8mm Keyed Bore',
]);
export type ThriftySprocketBore = z.infer<typeof zThriftySprocketBore>;

export const zThriftySprocket = z.object({
  teeth: z.number(),
  bore: zThriftySprocketBore,
  chainType: zChainType,
  sku: z.string(),
  url: z.string().url(),
});

export type ThriftySprocket = z.infer<typeof zThriftySprocket>;

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
