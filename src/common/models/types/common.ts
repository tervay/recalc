import { z } from "zod";
import type { Bore as ExtraTypesBore } from "../ExtraTypes";

// Shared Zod schema for MeasurementDict
export const zMeasurementDict = z.object({
  s: z.number(),
  u: z.string(),
});

// Map new format bore values to existing Bore type
export const zBore = z.enum([
  "8mm",
  '1.125" Round',
  '1/4" Round',
  '1/2" Hex',
  '3/8" Hex',
  "SplineXS",
  "SplineXL",
  "Falcon",
  "RS775",
  "RS550",
  "BAG",
  "MAXSpline",
] as const);
export type Bore = z.infer<typeof zBore>;

// Mapping function to convert new format bore to existing Bore type
export function mapBoreToExtraTypes(bore: Bore): ExtraTypesBore {
  const mapping: Record<Bore, ExtraTypesBore> = {
    "8mm": "1/2 Hex", // Approximate mapping
    '1.125" Round': "1.125in",
    '1/4" Round': "3/8 Round",
    '1/2" Hex': "1/2 Hex",
    '3/8" Hex': "3/8 Hex",
    SplineXS: "SplineXS",
    SplineXL: "SplineXL",
    Falcon: "Falcon",
    RS775: "775",
    RS550: "550",
    BAG: "1/2 Hex", // Approximate mapping
    MAXSpline: "MAXSpline",
  };
  return mapping[bore];
}

export const zFRCVendor = z.enum([
  "VEXpro",
  "WCP",
  "AndyMark",
  "REV",
  "VBeltGuys",
  "CTRE",
  "Anderson Power",
  "NI",
  "TTB",
  "Printed",
] as const);
export type FRCVendor = z.infer<typeof zFRCVendor>;

export const zPulleyBeltType = z.enum(["HTD", "GT2", "RT25"] as const);
export type PulleyBeltType = z.infer<typeof zPulleyBeltType>;

export const MotorBores: Bore[] = ["SplineXS", "Falcon", "RS775", "RS550"];

export const NonMotorBores: Bore[] = [
  "8mm",
  '1.125" Round',
  '1/4" Round',
  '1/2" Hex',
  '3/8" Hex',
  "SplineXL",
  "BAG",
  "MAXSpline",
];
