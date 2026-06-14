import { describe, expect, it } from 'vitest';

import { shouldInitOpenPanel } from '~/lib/openpanel';

const REAL_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BOT_USER_AGENT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const baseArgs = {
  isDev: false,
  isServer: false,
  userAgent: REAL_USER_AGENT,
  clientId: 'client-id',
};

describe('shouldInitOpenPanel', () => {
  it('initializes for a real browser in production with a client id', () => {
    expect(shouldInitOpenPanel(baseArgs)).toBe(true);
  });

  it('does not initialize on the server', () => {
    expect(shouldInitOpenPanel({ ...baseArgs, isServer: true })).toBe(false);
  });

  it('does not initialize in development', () => {
    expect(shouldInitOpenPanel({ ...baseArgs, isDev: true })).toBe(false);
  });

  it('does not initialize without a client id', () => {
    expect(shouldInitOpenPanel({ ...baseArgs, clientId: undefined })).toBe(
      false,
    );
    expect(shouldInitOpenPanel({ ...baseArgs, clientId: '' })).toBe(false);
  });

  it('does not initialize for bots', () => {
    expect(
      shouldInitOpenPanel({ ...baseArgs, userAgent: BOT_USER_AGENT }),
    ).toBe(false);
  });
});
