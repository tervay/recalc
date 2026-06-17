// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebounce } from '~/lib/hooks';

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
