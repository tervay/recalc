export const PRODUCT_TYPES = [
  'pulleys',
  'belts',
  'sprockets',
  'gears',
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];
// Planetaries can be added here later as a 5th product type
