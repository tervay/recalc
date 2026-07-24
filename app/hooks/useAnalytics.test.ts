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
    vi.clearAllMocks();
  });

  it('returns an object with a track function', async () => {
    const { useAnalytics } = await import('~/hooks/useAnalytics');
    getOpenPanelMock.mockReturnValue(null);

    const { result } = renderHook(() => useAnalytics());
    expect(typeof result.current.track).toBe('function');
  });

  describe('when OpenPanel is present', () => {
    it('forwards the event and data to the OpenPanel track function', async () => {
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
      result.current.track('button_click', { label: 'submit' });

      expect(opTrack).toHaveBeenCalledWith('button_click', { label: 'submit' });
      expect(opTrack).toHaveBeenCalledTimes(1);
    });

    it('passes undefined as data when called with no data argument', async () => {
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
      result.current.track('no_data_event');

      expect(opTrack).toHaveBeenCalledWith('no_data_event', undefined);
    });
  });

  describe('when getOpenPanel returns null', () => {
    it('does not throw', async () => {
      const { useAnalytics } = await import('~/hooks/useAnalytics');

      getOpenPanelMock.mockReturnValue(null);

      const { result } = renderHook(() => useAnalytics());
      expect(() =>
        result.current.track('silent_event', { x: 1 }),
      ).not.toThrow();
    });
  });
});
