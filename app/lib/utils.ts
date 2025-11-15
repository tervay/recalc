import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roundToNearestMultiple(
  roundable: number,
  multipleOf: number,
): number {
  return Math.ceil(roundable / multipleOf) * multipleOf;
}

export function obliterateArray<T>(array: T[], n: number): T[] {
  if (array.length === 0) return [];
  if (n <= 0) return array;

  const result = array.filter((_, index) => index % n === 0);
  const lastIndex = array.length - 1;

  // Always include the last element if it's not already included
  if (lastIndex > 0 && lastIndex % n !== 0) {
    result.push(array[lastIndex]);
  }

  return result;
}

export function range(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}
