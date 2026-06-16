// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock ~/lib/openpanel before any import of the hook so the hook uses our mock.
vi.mock('~/lib/openpanel', () => ({
  getOpenPanel: vi.fn<() => null>(),
}));

describe('useAnalytics', () => {
  let getOpenPanelMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const openpanel = await import('~/lib/openpanel');
    getOpenPanelMock = openpanel.getOpenPanel as ReturnType<typeof vi.fn>;
    getOpenPanelMock.mockReset();
  });

  afterEach(() => {
    // Clean up window.umami after every test so tests do not bleed state
    delete (window as Window & { umami?: unknown }).umami;
    vi.clearAllMocks();
  });

  it('returns an object with a track function', async () => {
    const { useAnalytics } = await import('~/hooks/useAnalytics');
    getOpenPanelMock.mockReturnValue(null);

    const { result } = renderHook(() => useAnalytics());
    expect(typeof result.current.track).toBe('function');
  });

  describe('when both sinks are present', () => {
    it('forwards the event and data to window.umami.track', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      const umamiTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      (window as Window & { umami?: { track: typeof umamiTrack } }).umami = {
        track: umamiTrack,
      };

      const opTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      getOpenPanelMock.mockReturnValue({ track: opTrack });

      const { result } = renderHook(() => useAnalytics());
      result.current.track('page_view', { page: '/home' });

      expect(umamiTrack).toHaveBeenCalledWith('page_view', { page: '/home' });
    });

    it('forwards the event and data to the OpenPanel track function', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      const umamiTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      (window as Window & { umami?: { track: typeof umamiTrack } }).umami = {
        track: umamiTrack,
      };

      const opTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      getOpenPanelMock.mockReturnValue({ track: opTrack });

      const { result } = renderHook(() => useAnalytics());
      result.current.track('button_click', { label: 'submit' });

      expect(opTrack).toHaveBeenCalledWith('button_click', { label: 'submit' });
    });

    it('calls both sinks on the same event', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      const umamiTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      (window as Window & { umami?: { track: typeof umamiTrack } }).umami = {
        track: umamiTrack,
      };

      const opTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      getOpenPanelMock.mockReturnValue({ track: opTrack });

      const { result } = renderHook(() => useAnalytics());
      result.current.track('custom_event', { value: 1 });

      expect(umamiTrack).toHaveBeenCalledTimes(1);
      expect(opTrack).toHaveBeenCalledTimes(1);
    });
  });

  describe('when window.umami is undefined', () => {
    it('does not throw', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      getOpenPanelMock.mockReturnValue(null);
      // window.umami is already absent (cleaned up in afterEach)

      const { result } = renderHook(() => useAnalytics());
      expect(() => result.current.track('event', { x: 1 })).not.toThrow();
    });

    it('still calls OpenPanel when umami is absent', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      const opTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      getOpenPanelMock.mockReturnValue({ track: opTrack });

      const { result } = renderHook(() => useAnalytics());
      result.current.track('event', { y: 2 });

      expect(opTrack).toHaveBeenCalledWith('event', { y: 2 });
    });
  });

  describe('when getOpenPanel returns null', () => {
    it('does not throw', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      const umamiTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      (window as Window & { umami?: { track: typeof umamiTrack } }).umami = {
        track: umamiTrack,
      };
      getOpenPanelMock.mockReturnValue(null);

      const { result } = renderHook(() => useAnalytics());
      expect(() => result.current.track('event')).not.toThrow();
    });

    it('still calls umami when OpenPanel is null', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      const umamiTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      (window as Window & { umami?: { track: typeof umamiTrack } }).umami = {
        track: umamiTrack,
      };
      getOpenPanelMock.mockReturnValue(null);

      const { result } = renderHook(() => useAnalytics());
      result.current.track('click', { button: 'save' });

      expect(umamiTrack).toHaveBeenCalledWith('click', { button: 'save' });
    });
  });

  describe('when both sinks are absent', () => {
    it('does not throw', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      getOpenPanelMock.mockReturnValue(null);

      const { result } = renderHook(() => useAnalytics());
      expect(() => result.current.track('silent_event')).not.toThrow();
    });
  });

  describe('track with no data argument', () => {
    it('passes undefined as data to both sinks', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      const umamiTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      (window as Window & { umami?: { track: typeof umamiTrack } }).umami = {
        track: umamiTrack,
      };

      const opTrack =
        vi.fn<
          (
            event: string,
            data?: Record<string, string | number | boolean>,
          ) => void
        >();
      getOpenPanelMock.mockReturnValue({ track: opTrack });

      const { result } = renderHook(() => useAnalytics());
      result.current.track('no_data_event');

      expect(umamiTrack).toHaveBeenCalledWith('no_data_event', undefined);
      expect(opTrack).toHaveBeenCalledWith('no_data_event', undefined);
    });
  });
});
