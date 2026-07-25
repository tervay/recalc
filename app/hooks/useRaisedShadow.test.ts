// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { useMotionValue } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const inactiveShadow = '0px 0px 0px rgba(0,0,0,0.8)';
const raisedShadow = '5px 5px 10px rgba(0,0,0,0.3)';

// Mock only `animate` from motion/react; keep everything else real.
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  return {
    ...actual,
    animate: vi.fn<() => void>(),
  };
});

describe('useRaisedShadow', () => {
  let animateMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const motionModule = await import('motion/react');
    animateMock = motionModule.animate as ReturnType<typeof vi.fn>;
    animateMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a MotionValue with the inactive shadow as its initial value', async () => {
    const { useRaisedShadow } = await import('~/hooks/useRaisedShadow');

    const { result } = renderHook(() => {
      const motionVal = useMotionValue(0);
      return useRaisedShadow(motionVal);
    });

    expect(result.current.get()).toBe(inactiveShadow);
  });

  it('calls animate with the raised shadow when the input value changes to non-zero', async () => {
    const { useRaisedShadow } = await import('~/hooks/useRaisedShadow');

    const { result } = renderHook(() => {
      const motionVal = useMotionValue(0);
      const boxShadow = useRaisedShadow(motionVal);
      return { motionVal, boxShadow };
    });

    act(() => {
      result.current.motionVal.set(1);
    });

    expect(animateMock).toHaveBeenCalledWith(
      result.current.boxShadow,
      raisedShadow,
    );
  });

  it('calls animate with the inactive shadow when the input value returns to 0', async () => {
    const { useRaisedShadow } = await import('~/hooks/useRaisedShadow');

    const { result } = renderHook(() => {
      const motionVal = useMotionValue(0);
      const boxShadow = useRaisedShadow(motionVal);
      return { motionVal, boxShadow };
    });

    act(() => {
      result.current.motionVal.set(5);
    });

    animateMock.mockClear();

    act(() => {
      result.current.motionVal.set(0);
    });

    expect(animateMock).toHaveBeenCalledWith(
      result.current.boxShadow,
      inactiveShadow,
    );
  });

  it('does not call animate again when the value stays non-zero (isActive does not change)', async () => {
    const { useRaisedShadow } = await import('~/hooks/useRaisedShadow');

    const { result } = renderHook(() => {
      const motionVal = useMotionValue(0);
      const boxShadow = useRaisedShadow(motionVal);
      return { motionVal, boxShadow };
    });

    act(() => {
      result.current.motionVal.set(1);
    });

    animateMock.mockClear();

    // Change to another non-zero value — wasActive === isActive, no animate call
    act(() => {
      result.current.motionVal.set(2);
    });

    expect(animateMock).not.toHaveBeenCalled();
  });

  it('does not call animate again when the value stays at 0', async () => {
    const { useRaisedShadow } = await import('~/hooks/useRaisedShadow');

    const { result } = renderHook(() => {
      const motionVal = useMotionValue(0);
      const boxShadow = useRaisedShadow(motionVal);
      return { motionVal, boxShadow };
    });

    // Trigger a raise then bring it back
    act(() => {
      result.current.motionVal.set(1);
    });
    act(() => {
      result.current.motionVal.set(0);
    });

    animateMock.mockClear();

    // Set to 0 again — no state change, no animate call
    act(() => {
      result.current.motionVal.set(0);
    });

    expect(animateMock).not.toHaveBeenCalled();
  });

  it('unsubscribes the change listener on unmount', async () => {
    const { useRaisedShadow } = await import('~/hooks/useRaisedShadow');

    const { result, unmount } = renderHook(() => {
      const motionVal = useMotionValue(0);
      const boxShadow = useRaisedShadow(motionVal);
      return { motionVal, boxShadow };
    });

    unmount();

    animateMock.mockClear();

    // After unmount, changes to the motion value must not trigger animate
    act(() => {
      result.current.motionVal.set(99);
    });

    expect(animateMock).not.toHaveBeenCalled();
  });

  it('calls animate raised → inactive on a full raise-then-lower cycle', async () => {
    const { useRaisedShadow } = await import('~/hooks/useRaisedShadow');

    const { result } = renderHook(() => {
      const motionVal = useMotionValue(0);
      const boxShadow = useRaisedShadow(motionVal);
      return { motionVal, boxShadow };
    });

    act(() => {
      result.current.motionVal.set(3);
    });

    act(() => {
      result.current.motionVal.set(0);
    });

    expect(animateMock).toHaveBeenNthCalledWith(
      1,
      result.current.boxShadow,
      raisedShadow,
    );
    expect(animateMock).toHaveBeenNthCalledWith(
      2,
      result.current.boxShadow,
      inactiveShadow,
    );
    expect(animateMock).toHaveBeenCalledTimes(2);
  });
});
