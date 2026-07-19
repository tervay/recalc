import { cachedFetch } from 'scripts/ingest/retrieval/cachedFetch';
import {
  fetchWithRetry,
  retryDelayMs,
} from 'scripts/ingest/retrieval/fetchWithRetry';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('scripts/ingest/retrieval/cachedFetch', () => ({
  cachedFetch: vi.fn<typeof cachedFetch>(),
}));

const mockedFetch = vi.mocked(cachedFetch);

function makeResponse(
  status: number,
  overrides: Partial<{
    headers: Headers;
    isCacheMiss: boolean;
  }> = {},
): Awaited<ReturnType<typeof cachedFetch>> {
  return {
    status,
    headers: overrides.headers ?? new Headers(),
    isCacheMiss: overrides.isCacheMiss ?? true,
    json: vi.fn<() => Promise<unknown>>(),
  } as unknown as Awaited<ReturnType<typeof cachedFetch>>;
}

describe('fetchWithRetry', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('resolves immediately on a terminal 200 without retrying', async () => {
    mockedFetch.mockResolvedValueOnce(makeResponse(200));

    const { response } = await fetchWithRetry('https://example.com', {
      backoffMs: 0,
    });

    expect(response.status).toBe(200);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('treats 404 as terminal and does not retry', async () => {
    mockedFetch.mockResolvedValueOnce(makeResponse(404));

    const { response } = await fetchWithRetry('https://example.com', {
      backoffMs: 0,
    });

    expect(response.status).toBe(404);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('retries a 429 rate-limit response until a later 200 succeeds', async () => {
    mockedFetch
      .mockResolvedValueOnce(makeResponse(429))
      .mockResolvedValueOnce(makeResponse(429))
      .mockResolvedValueOnce(makeResponse(200));

    const { response } = await fetchWithRetry('https://example.com', {
      backoffMs: 0,
    });

    expect(response.status).toBe(200);
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });

  it('throws once max attempts are exhausted on persistent 429s', async () => {
    mockedFetch.mockResolvedValue(makeResponse(429));

    await expect(
      fetchWithRetry('https://example.com', { backoffMs: 0, maxAttempts: 3 }),
    ).rejects.toThrow('HTTP 429');
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });

  it('retries when cachedFetch rejects (dropped connection) and then succeeds', async () => {
    mockedFetch
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValueOnce(makeResponse(200));

    const { response } = await fetchWithRetry('https://example.com', {
      backoffMs: 0,
    });

    expect(response.status).toBe(200);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});

describe('retryDelayMs', () => {
  it('honors a numeric Retry-After header, in milliseconds', () => {
    const headers = new Headers({ 'retry-after': '2' });
    const response = makeResponse(429, { headers });
    expect(retryDelayMs(1, response)).toBe(2000);
  });

  it('falls back to exponential backoff when Retry-After is absent', () => {
    const first = retryDelayMs(1, makeResponse(429));
    const second = retryDelayMs(2, makeResponse(429));
    // second attempt backs off strictly longer than the first (base doubles;
    // jitter is bounded and small relative to the base growth).
    expect(second).toBeGreaterThan(first);
  });

  it('ignores a non-numeric Retry-After header and falls back to backoff', () => {
    const headers = new Headers({ 'retry-after': 'not-a-number' });
    const response = makeResponse(429, { headers });
    expect(retryDelayMs(1, response)).toBeGreaterThan(0);
    expect(Number.isNaN(retryDelayMs(1, response))).toBe(false);
  });
});
