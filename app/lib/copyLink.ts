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
 * Re-encode a nuqs-serialized query string so every reserved character is
 * percent-encoded.
 *
 * nuqs intentionally leaves `{}`, `[]`, `,`, `:` and `()` raw for readability
 * (47ng/nuqs#372). Those URLs are standards-compliant, but they trip link
 * parsers that scan bare URLs out of surrounding text -- Chief Delphi's
 * Discourse autolinker truncates them. Every calculator serializes its
 * Measurement/Motor/Ratio params as JSON, so essentially every shared ReCalc
 * link is affected.
 *
 * Round-tripping through URLSearchParams is lossless, because nuqs's output
 * already follows form-urlencoded conventions (`%` as `%25`, literal `+` as
 * `%2B`, space as `+`). The read path (`useQueryParams`) decodes with
 * URLSearchParams too, so links shared before this change still parse.
 */
export function strictlyEncodeQueryString(serializedState: string): string {
  return new URLSearchParams(serializedState).toString();
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
    window.location.origin +
      window.location.pathname +
      '?' +
      strictlyEncodeQueryString(serializedState),
  );
  track('copy-link', buildCopyLinkData(title, serializedState));
}
