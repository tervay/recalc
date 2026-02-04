import * as z from 'zod';

import Measurement from '~/lib/models/Measurement';
import { type Bore, zBoreSchema, zVendorSchema } from '~/lib/types/common';

export const zJSONPulleySchema = z.object({
  teeth: z.number(),
  width: z.number().min(1), // (mm)
  profile: z.string(),
  pitch: z.number().min(1), // (mm)
  sku: z.string().nullable(),
  url: z.string().url(),
  bore: zBoreSchema,
  vendor: zVendorSchema,
});

export type JSONPulley = z.infer<typeof zJSONPulleySchema>;

export const zWCPPulleyBoreSchema = z.enum([
  '1/2" Hex',
  '8mm',
  '8mm Key',
  '8mm SplineXS',
  'Falcon',
  'RS775',
  'RS550',
] as const);
export type WCPPulleyBore = z.infer<typeof zWCPPulleyBoreSchema>;

export const zWCPPulleySchema = z.object({
  teeth: z.number(),
  width: z.number().min(1), // (mm)
  profile: z.string(),
  pitch: z.number().min(1), // (mm)
  sku: z.string().nullable(),
  url: z.string().url(),
  bore: zWCPPulleyBoreSchema,
});

export type WCPPulley = z.infer<typeof zWCPPulleySchema>;

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

export const zThriftyPulleyBoreSchema = z.enum([
  'Kraken Spline',
  'Falcon',
  '8mm Keyed',
  'Bearing / Hub',
  '1/2" Hex',
] as const);
export type ThriftyPulleyBore = z.infer<typeof zThriftyPulleyBoreSchema>;

export const zThriftyPulleySchema = z.object({
  teeth: z.number(),
  profile: z.enum(['HTD']),
  bore: zThriftyPulleyBoreSchema,
  sku: z.string(),
  url: z.string().url(),
});

export type ThriftyPulley = z.infer<typeof zThriftyPulleySchema>;

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

export const zREVPulleyBoreSchema = z.enum(['8mm', '1/2" Hex', 'MAXSpline']);
export type REVPulleyBore = z.infer<typeof zREVPulleyBoreSchema>;

export const zREVPulleySchema = z.object({
  teeth: z.number(),
  width: z.number().min(0.25), // (inches)
  bore: zREVPulleyBoreSchema,
  sku: z.string(),
  url: z.string().url(),
});

export type REVPulley = z.infer<typeof zREVPulleySchema>;

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

export const zAndyMarkPulleySchema = z.object({
  teeth: z.number(),
  width: z.number().min(1), // (mm)
  profile: z.string(),
  pitch: z.number().min(1), // (mm)
  sku: z.string().nullable(),
  url: z.string().url(),
  bore: zBoreSchema,
});

export type AndyMarkPulley = z.infer<typeof zAndyMarkPulleySchema>;

export function andyMarkPulleyToJsonPulley(pulley: AndyMarkPulley): JSONPulley {
  return {
    teeth: pulley.teeth,
    width: pulley.width,
    profile: pulley.profile,
    pitch: pulley.pitch,
    sku: pulley.sku,
    url: pulley.url,
    bore: pulley.bore,
    vendor: 'AndyMark',
  };
}
