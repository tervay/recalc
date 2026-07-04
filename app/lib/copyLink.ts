import { MotorParam } from '~/lib/types/queryParams';

export type TrackFn = (
  event: string,
  data?: Record<string, string | number | boolean>,
) => void;

/**
 * Build the analytics payload for a copy-link event. Includes the motor
 * identifier only when a valid `motor` param is present in `serializedState`
 * (the same serialized state string that gets copied to the clipboard, not
 * `window.location.search` — the calculators never write live state back to
 * the URL, so `location.search` can be stale or empty at click time).
 */
export function buildCopyLinkData(
  title: string,
  serializedState: string,
): Record<string, string> {
  const motorRaw = new URLSearchParams(serializedState).get('motor');
  const motor = motorRaw !== null ? MotorParam.parse(motorRaw) : null;
  return {
    calculator: title,
    ...(motor !== null && { motor: motor.identifier }),
  };
}

/**
 * Perform the copy-link side effects: write the shareable URL to the
 * clipboard and fire the analytics event. Both derive from the same
 * `serializedState` so the tracked motor always matches what was copied.
 */
export function handleCopyLink({
  title,
  serializedState,
  track,
}: {
  title: string;
  serializedState: string;
  track: TrackFn;
}): void {
  void navigator.clipboard.writeText(
    window.location.origin + window.location.pathname + '?' + serializedState,
  );
  track('copy-link', buildCopyLinkData(title, serializedState));
}
