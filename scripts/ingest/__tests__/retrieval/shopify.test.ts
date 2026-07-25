import { cachedFetch } from 'scripts/ingest/retrieval/cachedFetch';
import { fetchShopifyProducts } from 'scripts/ingest/retrieval/shopify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ShopifyProduct } from '~/lib/types/shopify';

vi.mock('scripts/ingest/retrieval/cachedFetch', () => ({
  cachedFetch: vi.fn<typeof cachedFetch>(),
}));

const mockedFetch = vi.mocked(cachedFetch);

function makeProduct(id: number): ShopifyProduct {
  return { id, handle: `product-${id}` } as unknown as ShopifyProduct;
}

function jsonResponse(
  status: number,
  body: unknown,
  isCacheMiss = true,
): Awaited<ReturnType<typeof cachedFetch>> {
  return {
    status,
    isCacheMiss,
    headers: new Headers(),
    json: vi.fn<() => Promise<unknown>>().mockResolvedValue(body),
  } as unknown as Awaited<ReturnType<typeof cachedFetch>>;
}

describe('fetchShopifyProducts', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('paginates until an empty page is returned', async () => {
    mockedFetch
      .mockResolvedValueOnce(
        jsonResponse(200, { products: [makeProduct(1), makeProduct(2)] }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { products: [makeProduct(3)] }))
      .mockResolvedValueOnce(jsonResponse(200, { products: [] }));

    const products = await fetchShopifyProducts('WCP');

    expect(products.map((p) => p.id)).toEqual([1, 2, 3]);
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });

  it('retries a rate-limited (429) page and continues once it succeeds', async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse(429, undefined))
      .mockResolvedValueOnce(jsonResponse(200, { products: [makeProduct(1)] }))
      .mockResolvedValueOnce(jsonResponse(200, { products: [] }));

    const products = await fetchShopifyProducts('WCP');

    expect(products.map((p) => p.id)).toEqual([1]);
    // 2 attempts for page 1 (429 then 200) + 1 for the terminating empty page.
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });

  it('throws a descriptive error once retries are exhausted on a rate-limited page', async () => {
    // Retry backoff uses real timers internally; fake them here so the six
    // exhausted attempts (up to ~15s of real backoff) resolve instantly.
    vi.useFakeTimers();
    try {
      mockedFetch.mockResolvedValue(jsonResponse(429, undefined));

      const result = fetchShopifyProducts('WCP');
      // Attach a handler immediately so the rejection is never briefly
      // unhandled while the fake timers below are advanced.
      result.catch(() => {});
      await vi.runAllTimersAsync();
      await expect(result).rejects.toThrow(
        /Failed to fetch WCP products page 1: Error: HTTP 429/,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('throws for an unconfigured vendor', async () => {
    await expect(fetchShopifyProducts('REV')).rejects.toThrow(
      'No Shopify config for vendor: REV',
    );
  });
});
