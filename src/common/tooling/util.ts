/* eslint-disable @typescript-eslint/ban-ts-comment */

import Measurement from "common/models/Measurement";

// @ts-ignore
self.$RefreshReg$ = NoOp;

export function NoOp(..._: unknown[]): void {
  // Do nothing
}

export const ReturnFalse: () => boolean = () => false;

export function uuid(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function buildUrlForCurrentPage(queryString: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?${queryString}`;
}

export function getRandomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function isLocalhost(hostname = window.location.hostname): boolean {
  return (
    ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", ""].includes(hostname) ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.0.") ||
    hostname.endsWith(".local")
  );
}

export function roundToNearestMulitple(
  roundable: number,
  multipleOf: number,
): number {
  return Math.ceil(roundable / multipleOf) * multipleOf;
}

export function closestNumberFromArray(array: number[], n: number): number {
  return array.reduce((prev, curr) =>
    Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev,
  );
}

export function gappedRange(
  start: number,
  end: number,
  length: number,
  round?: boolean,
): number[] {
  const step = (end - start) / length;
  const range = [];
  for (let i = start; i <= end; i += step) {
    range.push(round ? Math.round(i) : i);
  }

  return range;
}

export function consoleGroup(
  name: string,
  doLog: () => boolean,
  vars: Record<string, unknown>,
): void {
  if (doLog()) {
    console.group(name);
    console.log(JSON.stringify(vars, undefined, 2));
    console.groupEnd();
  }
}

export function stringifyMeasurements(
  objs: Record<string, Measurement>,
): Record<string, string> {
  const ret: Record<string, string> = {};
  Object.entries(objs).forEach(([k, v]) => {
    ret[k] = v.format();
  });
  return ret;
}

export function JSONifyMeasurements(
  objs: Record<string, Measurement>,
): Record<string, Record<string, unknown>> {
  const ret: Record<string, Record<string, unknown>> = {};
  Object.entries(objs).forEach(([k, v]) => {
    ret[k] = v.toDict();
  });

  return ret;
}

export const fixFloatingPoint = (n: number): number => {
  return Number(n.toFixed(12));
};

export const wrapString = (raw: string, n: number): string | undefined =>
  raw.match(new RegExp(`.{1,${n}}`, "g"))?.join("\n");

export function getCurrentFunctionName(offset = 0): string {
  const err = new Error();
  if (err.stack === undefined) {
    return "UNKNOWN_METHOD";
  }

  return err.stack.split("\n")[2 + offset].split(" ")[5];
}

export function* permutations<T>(array: T[], r: number) {
  // Algorythm copied from Python `itertools.permutations`.
  const n = array.length;
  if (r === undefined) {
    r = n;
  }
  if (r > n) {
    return;
  }
  let indices = [];
  for (let i = 0; i < n; i++) {
    indices.push(i);
  }
  const cycles = [];
  for (let i = n; i > n - r; i--) {
    cycles.push(i);
  }
  const res = [];
  for (let k = 0; k < r; k++) {
    res.push(array[indices[k]]);
  }
  yield res;

  let broken = false;
  while (n > 0) {
    for (let i = r - 1; i >= 0; i--) {
      cycles[i]--;
      if (cycles[i] === 0) {
        indices = indices
          .slice(0, i)
          .concat(indices.slice(i + 1).concat(indices.slice(i, i + 1)));
        cycles[i] = n - i;
        broken = false;
      } else {
        const j = cycles[i];
        const x = indices[i];
        indices[i] = indices[n - j];
        indices[n - j] = x;
        const res = [];
        for (let k = 0; k < r; k++) {
          res.push(array[indices[k]]);
        }
        yield res;
        broken = true;
        break;
      }
    }
    if (broken === false) {
      break;
    }
  }

  return;
}

export function* combinationsWithReplacement<T>(
  iterable: Iterable<T>,
  r: number,
): Generator<T[]> {
  if (!Number.isInteger(r) || r < 0) {
    throw RangeError("r must be a non-negative integer");
  }
  const pool = [...iterable];
  const n = pool.length;
  if (n === 0 && r > 0) {
    return;
  }
  const indices = new Uint32Array(r);
  yield Array(r).fill(pool[0]);
  while (true) {
    let i: number;
    loop: {
      for (i = r - 1; i >= 0; i--) {
        if (indices[i] !== n - 1) {
          break loop;
        }
      }
      return;
    }
    const result: T[] = Array(r);
    for (let j = 0; j < i; j++) {
      result[j] = pool[indices[j]];
    }
    const index = indices[i] + 1;
    const element = pool[index];
    for (let j = i; j < r; j++) {
      indices[j] = index;
      result[j] = element;
    }
    yield result;
  }
}
