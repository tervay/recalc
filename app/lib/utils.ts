import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const SNAPSHOT_PRECISION = 5;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roundToNearestMultiple(
  roundable: number,
  multipleOf: number,
): number {
  return Math.ceil(roundable / multipleOf) * multipleOf;
}

export function range(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function toFixed(
  n: number,
  precision: number = SNAPSHOT_PRECISION,
): number {
  return parseFloat(n.toFixed(precision));
}
