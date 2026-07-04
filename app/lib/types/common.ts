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

export const VENDOR_NAMES = [
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
] as const;
export type Vendor = (typeof VENDOR_NAMES)[number];
export const zVendorSchema = z.enum(VENDOR_NAMES);

/**
 * User-facing power-transmission families selectable per ratio-finder stage.
 * These map onto the internal {@link SkuInfo} families as follows:
 *   Gear -> 'Gear', Belt -> 'Pulley', Chain -> 'Sprocket', Planetary -> 'Planetary'.
 */
export const STAGE_FAMILIES = ['Gear', 'Belt', 'Chain', 'Planetary'] as const;
export const zStageFamilySchema = z.enum(STAGE_FAMILIES);
export type StageFamily = z.infer<typeof zStageFamilySchema>;

export type StateHook<T> = [T, Dispatch<SetStateAction<T>>];

export type HasStateHook<T> = {
  stateHook: StateHook<T>;
};
