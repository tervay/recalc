import { EXCLUSION_KEYWORDS } from 'scripts/ingest/parsing/exclusions';
import type { VendorName } from 'scripts/ingest/vendors';

import type { ShopifyProduct, ShopifyVariant } from '~/lib/types/shopify';
import type { WheelBore, WheelType } from '~/lib/types/wheels';

const BORE_PATTERNS: [RegExp, WheelBore][] = [
  [/maxspline/i, 'MAXSpline'],
  [/nub/i, 'Nub Bore'],
  [/14\s*mm/i, '14mm Hex'],
  [/\b7\s*mm/i, '7mm Hex'],
  [/\b5\s*mm/i, '5mm Hex'],
  [/\b8\s*mm/i, '8mm'],
  [/1[-\s]*1\/4|1\.25/i, '1.25" Round'],
  [/bearing|1\.125/i, '1.125" Round'],
  [/(?:1\/2|0\.50{0,2}(?!\d))[^a-z]*(?:in\.?)?\s*hex/i, '1/2" Hex'],
  [/(?:3\/8|0\.375)[^a-z]*(?:in\.?)?\s*hex/i, '3/8" Hex'],
];

export function normalizeWheelBore(text: string): WheelBore | null {
  for (const [pattern, bore] of BORE_PATTERNS) {
    if (pattern.test(text)) return bore;
  }
  return null;
}

const MM_PER_INCH = 25.4;

function roundMm(mm: number): number {
  return Math.round(mm * 1e4) / 1e4;
}

const DIAMETER_PATTERNS: [RegExp, (m: RegExpExecArray) => number][] = [
  [
    /(\d+)\s+(\d+)\/(\d+)\s*(?:in\b|inch|")/i,
    (m) => (Number(m[1]) + Number(m[2]) / Number(m[3])) * MM_PER_INCH,
  ],
  [/(\d+(?:\.\d+)?)\s*mm/i, (m) => Number(m[1])],
  [
    /(\d+(?:\.\d+)?)\s*(?:in\b|in\.|inch|")/i,
    (m) => Number(m[1]) * MM_PER_INCH,
  ],
];

export function parseDiameterMm(text: string): number | null {
  for (const [pattern, toMm] of DIAMETER_PATTERNS) {
    const match = pattern.exec(text);
    if (match) return roundMm(toMm(match));
  }
  return null;
}

const WHEEL_BORE_OVERRIDES: Record<string, WheelBore> = {
  'REV:REV-41-1160-PK2': '5mm Hex',
  'REV:REV-41-1190-PK2': '5mm Hex',
  'REV:REV-41-1350-PK4': '5mm Hex',
  'REV:REV-41-1353-PK4': '5mm Hex',
  'REV:REV-41-1354-PK2': '5mm Hex',
  'REV:REV-41-1267': '5mm Hex',
  'REV:REV-45-1655': '5mm Hex',
  'AndyMark:custom-colored-35a-durometer-stealth-wheels': '1/2" Hex',
  'AndyMark:custom-colored-35a-durometer-compliant-wheels': '1/2" Hex',
  'AndyMark:6-in-sr-mecanum-wheels-2': '1.125" Round',
  'AndyMark:plaction-wheels': '1.125" Round',
  'AndyMark:8-in-plastic-omni-wheel': 'AndyMark Hub',
  'AndyMark:8-in-dualie-plastic-omni-wheel': 'AndyMark Hub',
  'AndyMark:smoothgrip-wheels': 'AndyMark Hub',
  'AndyMark:higrip-wheels': 'AndyMark Hub',
  'AndyMark:4-in-sd-mecanum-wheel': 'AndyMark Hub',
  'AndyMark:8-in-mk-mecanum-wheels': 'AndyMark Hub',
  'AndyMark:duraomni-wheel': 'AndyMark Hub',
  'AndyMark:2-25-in-hd-mecanum-vectored-intake-wheel': '1/2" Hex',
};

export function boreForWheel(
  vendor: VendorName,
  identifiers: { sku: string | null; handle: string },
  title: string,
  boreText: string | null,
  vendorDefault?: WheelBore,
): WheelBore | null {
  const parsed = boreText === null ? null : normalizeWheelBore(boreText);
  if (parsed) return parsed;

  const override =
    WHEEL_BORE_OVERRIDES[`${vendor}:${identifiers.sku}`] ??
    WHEEL_BORE_OVERRIDES[`${vendor}:${identifiers.handle}`];
  if (override) return override;

  if (vendorDefault) return vendorDefault;

  reportUnresolvedWheelBore(
    vendor,
    identifiers.sku ?? identifiers.handle,
    title,
  );
  return null;
}

const LEADING_NOISE_PATTERNS = [
  /^\d+T\s+x\s+/i,
  /^QTY\s+\d+\s*-\s*/i,
  /^\d+(?:\.\d+)?(?:\/\d+)?\s*(?:inch|in\.?|mm|")\s*(?:OD|WD|Wide)?\s*(?:x\s*)?/i,
];

const DROPPED_SEGMENT_PATTERNS = [/^QTY\s+\d+$/i, /durometer/i];

export function wheelNameFromTitle(title: string): string {
  let name = title.split('(')[0].trim();

  const familyEnd = /.*\bwheels?\b(\s+set)?/i.exec(name);
  if (familyEnd) name = familyEnd[0];

  name = name
    .split(' - ')
    .filter(
      (segment) =>
        !DROPPED_SEGMENT_PATTERNS.some((pattern) => pattern.test(segment)),
    )
    .join(' - ');

  let previous = '';
  while (previous !== name) {
    previous = name;
    for (const pattern of LEADING_NOISE_PATTERNS) {
      name = name.replace(pattern, '');
    }
  }

  return name.trim();
}

const DUROMETER_PATTERNS = [/\b(\d{2})A\b/i, /\b(soft|medium|hard)\b/i];

export function parseDurometer(text: string): string | null {
  const shore = DUROMETER_PATTERNS[0].exec(text);
  if (shore) return `${shore[1]}A`;

  const rating = DUROMETER_PATTERNS[1].exec(text);
  if (rating) {
    const word = rating[1].toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  return null;
}

export function skuOrNull(sku: string | null): string | null {
  return sku === null || sku === '' ? null : sku;
}

export function reportUnresolvedWheelBore(
  vendor: VendorName,
  key: string,
  title: string,
): void {
  console.warn(`  [wheels] undetermined bore: ${vendor} | ${key} | ${title}`);
}

const NON_WHEEL_KEYWORDS = [
  'hub',
  'fork',
  'tire',
  'tread',
  'inner tube',
  'rim',
  'axle',
  'plate',
  'roller',
  'adapter',
  'mount',
  'bundle',
  'hardware',
  'spare',
  'chassis',
  'extrusion',
  'flywheel',
  'conversion',
  'core',
  'shaft',
  'web',
  'upgrade',
  'drive base',
  'gear ratio',
];

export function isWheelProduct(title: string): boolean {
  const lower = title.toLowerCase();
  if (!lower.includes('wheel')) return false;
  if (EXCLUSION_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return false;
  }
  return !NON_WHEEL_KEYWORDS.some((keyword) => lower.includes(keyword));
}

const TYPE_PATTERNS: [RegExp, WheelType][] = [
  [/flex/i, 'Flex'],
  [/omni|dualie/i, 'Omni'],
  [/mecanum/i, 'Mecanum'],
  [/pneumatic/i, 'Pneumatic'],
  [/aluminum|billet/i, 'Billet'],
  [/traction|urethane/i, 'Traction'],
  [/grip|plaction|flap|cone|spike|performance/i, 'Grip'],
  [/compliant|stealth|sushi|squish|intake|vector/i, 'Compliant'],
];

export function classifyWheelType(title: string): WheelType | null {
  for (const [pattern, type] of TYPE_PATTERNS) {
    if (pattern.test(title)) return type;
  }
  return null;
}

export function optionValueByName(
  product: ShopifyProduct,
  variant: ShopifyVariant,
  namePattern: RegExp,
): string | null {
  const index = product.options.findIndex((option) =>
    namePattern.test(option.name),
  );
  if (index < 0) return null;
  return [variant.option1, variant.option2, variant.option3][index] ?? null;
}
