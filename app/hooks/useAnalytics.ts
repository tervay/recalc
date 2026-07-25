import { getOpenPanel } from '~/lib/openpanel';

export function useAnalytics() {
  return {
    track: (
      event: string,
      data?: Record<string, string | number | boolean>,
    ): void => {
      void getOpenPanel()?.track(event, data);
    },
  };
}
