import Measurement from '~/lib/models/Measurement';
import type { Bore } from '~/lib/types/common';

// REV's live feed carries no structured spec fields (see
// scripts/ingest/retrieval/rev.ts) - every mechanical spec (tooth count, DP,
// bore, width) is embedded in free-text product names, and the free text is
// not uniform across product families. These helpers are shared regexes/
// lookups used by the REV parsers to pull specs out of `product.title`
// (== the feed's `name`).

// A REV product `url` (used as the synthetic `handle`) is the stable,
// family-scoped identifier - e.g. every "20DP Gears - 1/2in Hex" SKU shares
// one listing url. Names vary per family in structure but not per-entry
// within a family, so parsers key off the normalized url rather than
// keyword-matching the free text.
export function normalizeRevUrl(url: string): string {
  return url.toLowerCase().replace(/\/+$/, '');
}

export function inToMm(inches: number): number {
  return new Measurement(inches, 'in').to('mm').scalar;
}

export const PROFILE_PITCH_MM: Record<string, number> = {
  RT25: inToMm(0.25),
  GT2: 3,
};

// Tooth count appears as either "18T" or "32 Tooth" depending on family.
// Requires the digits to be immediately followed (only whitespace between)
// by the unit, so it doesn't false-match unrelated numbers earlier in the
// name (DP counts, SKU fragments, pack sizes, prices).
export const TEETH_RE = /(\d+)\s*(?:tooth|t\b)/i;

export const DP_RE = /(\d+)\s*dp\b/i;

// Matches "1/2in Width" or "1in Width", capturing the inch fraction/whole
// number ("1/2" or "1").
export const WIDTH_IN_RE = /(\d+(?:\/\d+)?)\s*in\s*width/i;

export function parseInchesToken(token: string): number {
  const [num, den] = token.split('/');
  return den ? Number(num) / Number(den) : Number(num);
}

// Free-text bore tokens REV uses, mapped to the canonical Bore enum
// (app/lib/types/common.ts). Tokens with no equivalent there (e.g. the
// "15T Spline" bore REV introduced alongside MAXSpline) intentionally have
// no entry, so normalizeBore returns null and the product is skipped rather
// than guessed at.
const BORE_TOKENS: { pattern: RegExp; bore: Bore }[] = [
  { pattern: /1\/2in\s*(?:rounded\s*)?hex\b/i, bore: '1/2" Hex' },
  { pattern: /3\/8in\s*(?:rounded\s*)?hex\b/i, bore: '3/8" Hex' },
  { pattern: /\b8mm\b/i, bore: '8mm' },
  { pattern: /\bmaxspline\b/i, bore: 'MAXSpline' },
  { pattern: /\b550\s*motor\s*pinion/i, bore: 'RS550' },
  { pattern: /\brs550\b/i, bore: 'RS550' },
];

export function normalizeBore(text: string): Bore | null {
  for (const { pattern, bore } of BORE_TOKENS) {
    if (pattern.test(text)) return bore;
  }
  return null;
}
