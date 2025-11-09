import { z } from 'zod';

import Measurement from '~/lib/models/Measurement';
import { type Bore, zBore } from '~/lib/types/common';

export const zJSONPulley = z.object({
  teeth: z.number(),
  width: z.number().min(1), // (mm)
  profile: z.string(),
  pitch: z.number().min(1), // (mm)
  sku: z.string().nullable(),
  url: z.string().url(),
  bore: zBore,
  vendor: z.string(),
});

export type JSONPulley = z.infer<typeof zJSONPulley>;

export const zWCPPulleyBore = z.enum([
  '1/2" Hex',
  '8mm',
  '8mm Key',
  '8mm SplineXS',
  'Falcon',
  'RS775',
  'RS550',
] as const);
export type WCPPulleyBore = z.infer<typeof zWCPPulleyBore>;

export const zWCPPulley = z.object({
  teeth: z.number(),
  width: z.number().min(1), // (mm)
  profile: z.string(),
  pitch: z.number().min(1), // (mm)
  sku: z.string().nullable(),
  url: z.string().url(),
  bore: zWCPPulleyBore,
});

export type WCPPulley = z.infer<typeof zWCPPulley>;

export function wcpPulleyToJsonPulley(pulley: WCPPulley): JSONPulley {
  const wcpBoreToJsonBore: Record<WCPPulleyBore, Bore> = {
    '8mm': '8mm',
    '1/2" Hex': '1/2" Hex',
    '8mm Key': '8mm',
    '8mm SplineXS': 'SplineXS',
    Falcon: 'Falcon',
    RS775: 'RS775',
    RS550: 'RS550',
  };

  return {
    ...pulley,
    bore: wcpBoreToJsonBore[pulley.bore],
    vendor: 'WCP',
  };
}

export const zThriftyPulleyBore = z.enum([
  'Kraken Spline',
  'Falcon',
  '8mm Keyed',
  'Bearing / Hub',
  '1/2" Hex',
] as const);
export type ThriftyPulleyBore = z.infer<typeof zThriftyPulleyBore>;

export const zThriftyPulley = z.object({
  teeth: z.number(),
  profile: z.enum(['HTD']),
  bore: zThriftyPulleyBore,
  sku: z.string(),
  url: z.string().url(),
});

export type ThriftyPulley = z.infer<typeof zThriftyPulley>;

export function thriftyPulleyToJsonPulley(pulley: ThriftyPulley): JSONPulley {
  const thriftyBoreToJsonBore: Record<ThriftyPulleyBore, Bore> = {
    'Kraken Spline': 'SplineXS',
    Falcon: 'Falcon',
    '8mm Keyed': '8mm',
    'Bearing / Hub': '1.125" Round',
    '1/2" Hex': '1/2" Hex',
  };

  return {
    ...pulley,
    bore: thriftyBoreToJsonBore[pulley.bore],
    vendor: 'Thrifty',
    width: 18.5,
    pitch: 5,
  };
}

export const zREVPulleyBore = z.enum(['8mm', '1/2" Hex', 'MAXSpline']);
export type REVPulleyBore = z.infer<typeof zREVPulleyBore>;

export const zREVPulley = z.object({
  teeth: z.number(),
  width: z.number().min(0.25), // (inches)
  bore: zREVPulleyBore,
  sku: z.string(),
  url: z.string().url(),
});

export type REVPulley = z.infer<typeof zREVPulley>;

export function revPulleyToJsonPulley(pulley: REVPulley): JSONPulley {
  return {
    teeth: pulley.teeth,
    width: new Measurement(pulley.width, 'in').to('mm').scalar, // Convert inches to mm
    profile: 'RT25',
    pitch: new Measurement(0.25, 'in').to('mm').scalar, // Convert inches to mm
    sku: pulley.sku,
    url: pulley.url,
    bore: pulley.bore,
    vendor: 'REV',
  };
}
