// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsMobile } from '~/hooks/use-mobile';

type ChangeHandler = (event: { matches: boolean }) => void;

function makeMatchMediaMock(matches: boolean) {
  const handlers: ChangeHandler[] = [];

  const mql = {
    matches,
    addEventListener: vi.fn<(_event: string, handler: ChangeHandler) => void>(
      (_event, handler) => {
        handlers.push(handler);
      },
    ),
    removeEventListener: vi.fn<
      (_event: string, handler: ChangeHandler) => void
    >((_event, handler) => {
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }),
    // Expose handlers so tests can fire change events
    _handlers: handlers,
  };

  return mql;
}

describe('useIsMobile', () => {
  let matchMediaMock: ReturnType<typeof makeMatchMediaMock>;

  beforeEach(() => {
    // Default: desktop width
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024,
    });

    matchMediaMock = makeMatchMediaMock(false);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn<() => typeof matchMediaMock>(() => matchMediaMock),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when innerWidth is at the breakpoint boundary (768)', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 768,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns false when innerWidth is above the breakpoint (1024)', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true when innerWidth is below the breakpoint (767)', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 767,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns true for a very small innerWidth (320)', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 320,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('updates from false to true when the change event fires after innerWidth narrows', () => {
    // Start on desktop
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate the browser resizing below the breakpoint
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: 500,
      });
      // Fire all registered change listeners
      for (const handler of matchMediaMock._handlers) {
        handler({ matches: true });
      }
    });

    expect(result.current).toBe(true);
  });

  it('updates from true to false when the change event fires after innerWidth widens', () => {
    // Start on mobile
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 400,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    // Simulate the browser resizing above the breakpoint
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: 1280,
      });
      for (const handler of matchMediaMock._handlers) {
        handler({ matches: false });
      }
    });

    expect(result.current).toBe(false);
  });

  it('registers exactly one change listener on mount', () => {
    renderHook(() => useIsMobile());
    expect(matchMediaMock.addEventListener).toHaveBeenCalledTimes(1);
    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('removes the change listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());

    expect(matchMediaMock.removeEventListener).not.toHaveBeenCalled();

    unmount();

    expect(matchMediaMock.removeEventListener).toHaveBeenCalledTimes(1);
    expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('removes the same function reference that was added', () => {
    const { unmount } = renderHook(() => useIsMobile());

    const addedFn = matchMediaMock.addEventListener.mock.calls[0]?.[1];
    unmount();
    const removedFn = matchMediaMock.removeEventListener.mock.calls[0]?.[1];

    expect(addedFn).toBeDefined();
    expect(addedFn).toBe(removedFn);
  });

  it('invokes matchMedia with the correct query string', () => {
    renderHook(() => useIsMobile());
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });
});
