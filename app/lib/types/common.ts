import type { Dispatch, SetStateAction } from 'react';
import * as z from 'zod';

export const zBoreSchema = z.enum([
  '8mm',
  '1.125" Round',
  '1/4" Round',
  '1/2" Hex',
  '3/8" Hex',
  'SplineXS',
  'SplineXL',
  'MAXSpline',
  'Falcon',
  'RS775',
  'RS550',
  'BAG',
  'Vortex',
  '5mm Hex',
] as const);
export type Bore = z.infer<typeof zBoreSchema>;

export const zVendorSchema = z.enum([
  'AndyMark',
  'BaneBots',
  'CTRE',
  'Custom',
  'LastAnvil',
  'REV',
  'SDS',
  'Swyft',
  'Thrifty',
  'VBeltGuys',
  'VEX',
  'WCP',
] as const);
export type Vendor = z.infer<typeof zVendorSchema>;

export type StateHook<T> = [T, Dispatch<SetStateAction<T>>];

export type HasStateHook<T> = {
  stateHook: StateHook<T>;
};
