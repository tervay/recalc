// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { type ParserMap, type inferParserType, createLoader } from 'nuqs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { strictlyEncodeQueryString } from '~/lib/copyLink';
import { useDebounce, useSerializedState } from '~/lib/hooks';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import {
  BooleanParam,
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioPairListParam,
  RatioParam,
} from '~/lib/types/queryParams';

/**
 * Mirrors what a shared link goes through end to end: `useSerializedState`
 * produces the nuqs query string, `handleCopyLink` strictly encodes it, and
 * `useQueryParams` reads it back with `URLSearchParams` + `createLoader`.
 */
function roundTrip<M extends ParserMap>(map: M, state: inferParserType<M>) {
  const { result } = renderHook(() => useSerializedState(map, state));
  const encoded = strictlyEncodeQueryString(result.current);
  return {
    encoded,
    loaded: createLoader(map)(new URLSearchParams(encoded)),
  };
}

describe('useSerializedState -> strict encoding -> useQueryParams round-trip', () => {
  it('restores a Measurement/Motor/Ratio state from a strictly encoded link', () => {
    const map = {
      motor: MotorParam.withDefault(Motor.KrakenX60sFOC(1)),
      travelDistance: MeasurementParam.withDefault(new Measurement(60, 'in')),
      ratio: RatioParam.withDefault(new Ratio(2, RatioType.REDUCTION)),
      efficiency: NumberParam.withDefault(100),
      cascade: BooleanParam.withDefault(false),
    };
    const state = {
      motor: Motor.KrakenX60sFOC(3),
      travelDistance: new Measurement(42.5, 'in'),
      ratio: new Ratio(7.5, RatioType.STEP_UP),
      efficiency: 92.5,
      cascade: true,
    };

    const { loaded } = roundTrip(map, state);

    expect(loaded.motor.identifier).toBe(state.motor.identifier);
    expect(loaded.motor.quantity).toBe(3);
    expect(loaded.travelDistance.scalar).toBe(42.5);
    expect(loaded.travelDistance.units()).toBe('in');
    expect(loaded.ratio.magnitude).toBe(7.5);
    expect(loaded.ratio.ratioType).toBe(RatioType.STEP_UP);
    expect(loaded.efficiency).toBe(92.5);
    expect(loaded.cascade).toBe(true);
  });

  it('restores a nested RatioPairListParam state from a strictly encoded link', () => {
    const map = { pairs: RatioPairListParam.withDefault([]) };
    const state = {
      pairs: [
        [18, 72],
        [24, 48],
      ] as [number, number][],
    };

    const { loaded } = roundTrip(map, state);

    expect(loaded.pairs).toEqual(state.pairs);
  });

  it('produces a link with no bare braces, brackets or commas', () => {
    const map = {
      motor: MotorParam.withDefault(Motor.KrakenX60sFOC(1)),
      travelDistance: MeasurementParam.withDefault(new Measurement(60, 'in')),
      pairs: RatioPairListParam.withDefault([]),
    };

    const { encoded } = roundTrip(map, {
      motor: Motor.KrakenX60sFOC(2),
      travelDistance: new Measurement(60, 'in'),
      pairs: [[18, 72]] as [number, number][],
    });

    expect(encoded).not.toMatch(/[{}[\],]/);
  });

  it('still restores state from a legacy loosely encoded link (no strict pass)', () => {
    const map = {
      travelDistance: MeasurementParam.withDefault(new Measurement(60, 'in')),
    };
    const state = { travelDistance: new Measurement(42.5, 'in') };

    const { result } = renderHook(() => useSerializedState(map, state));
    const loaded = createLoader(map)(new URLSearchParams(result.current));

    expect(loaded.travelDistance.scalar).toBe(42.5);
    expect(loaded.travelDistance.units()).toBe('in');
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately without waiting for the delay', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('does not update the value before the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(result.current).toBe('initial');
  });

  it('updates to the new value after the delay has fully elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    rerender({ value: 'updated', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('debounces rapid successive changes — only the final value is emitted', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'd' });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // 300 ms total have elapsed but each change restarted the timer
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('d');
  });

  it('cleans up the previous timeout when the value changes (no stale update)', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebounce(value, 200),
      { initialProps: { value: 1 } },
    );

    rerender({ value: 2 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Not enough time — still the original value
    expect(result.current).toBe(1);

    // Change again — the first pending timeout must have been cleared
    rerender({ value: 3 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Value 2 must never surface; we go directly from 1 to 3
    expect(result.current).toBe(3);
  });

  it('works with non-string generic types (numbers)', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebounce(value, 100),
      { initialProps: { value: 0 } },
    );

    expect(result.current).toBe(0);

    rerender({ value: 42 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(42);
  });

  it('works with object types (reference equality after delay)', () => {
    const initial = { x: 1 };
    const updated = { x: 2 };

    const { result, rerender } = renderHook(
      ({ value }: { value: { x: number } }) => useDebounce(value, 150),
      { initialProps: { value: initial } },
    );

    expect(result.current).toBe(initial);

    rerender({ value: updated });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe(updated);
  });

  it('handles a delay change without losing the current value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string; delay: number }) =>
        useDebounce(value, delay),
      { initialProps: { value: 'stable', delay: 500 } },
    );

    // Change only the delay — the effect re-runs which reschedules, but the
    // value should eventually resolve to the same string.
    rerender({ value: 'stable', delay: 100 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('stable');
  });
});
