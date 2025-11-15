import type { Dispatch, SetStateAction } from 'react';
import { z } from 'zod';

export const zBore = z.enum([
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
export type Bore = z.infer<typeof zBore>;

export type StateHook<T> = [T, Dispatch<SetStateAction<T>>];

export type HasStateHook<T> = {
  stateHook: StateHook<T>;
};
