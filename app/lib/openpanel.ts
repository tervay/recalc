import { OpenPanel } from '@openpanel/web';
import { isbot } from 'isbot';

let instance: OpenPanel | null = null;

/**
 * Decide whether OpenPanel should be initialized for the current environment.
 *
 * Kept pure and side-effect free so the gating logic can be unit tested
 * without a DOM. Mirrors the guards used for the Umami script: never on the
 * server, never in development, never for bots, and only when a client id is
 * configured.
 */
export function shouldInitOpenPanel({
  isDev,
  isServer,
  userAgent,
  clientId,
}: {
  isDev: boolean;
  isServer: boolean;
  userAgent: string;
  clientId: string | undefined;
}): boolean {
  if (isServer) return false;
  if (isDev) return false;
  if (!clientId) return false;
  if (isbot(userAgent)) return false;
  return true;
}

/**
 * Lazily create the singleton OpenPanel client. Returns the existing instance
 * on subsequent calls, or `null` when analytics should not run in the current
 * environment (server render, development, bots, or missing client id).
 */
export function initOpenPanel(): OpenPanel | null {
  if (instance) return instance;

  const clientId = import.meta.env.VITE_OPENPANEL_CLIENT_ID;
  const shouldInit = shouldInitOpenPanel({
    isDev: import.meta.env.DEV,
    isServer: typeof document === 'undefined',
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
    clientId,
  });

  // The `!clientId` check is redundant with `shouldInit` but narrows the type
  // so `clientId` is `string` below without a non-null assertion.
  if (!shouldInit || !clientId) return null;

  instance = new OpenPanel({
    clientId,
    // Self-hosted OpenPanel instance; without this the SDK posts to the
    // hosted cloud at api.openpanel.dev.
    apiUrl: 'https://op.reca.lc/api',
    trackScreenViews: true,
    trackOutgoingLinks: true,
    trackAttributes: true,
  });

  return instance;
}

/**
 * The active OpenPanel client, or `null` if it has not been initialized (or is
 * disabled for this environment). Use this to forward custom events.
 */
export function getOpenPanel(): OpenPanel | null {
  return instance;
}
