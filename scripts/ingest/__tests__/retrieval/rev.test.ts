import { cachedFetch } from 'scripts/ingest/retrieval/cachedFetch';
import { fetchREVProducts } from 'scripts/ingest/retrieval/rev';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('scripts/ingest/retrieval/cachedFetch', () => ({
  cachedFetch: vi.fn<typeof cachedFetch>(),
}));

const mockedFetch = vi.mocked(cachedFetch);

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

describe('fetchREVProducts', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('rejects a feed entry missing a required field', async () => {
    mockedFetch.mockResolvedValueOnce(
      jsonResponse(200, [
        {
          sku: 'REV-11-1107',
          // name intentionally omitted
          availability_status: 'Available',
          price: 39.42,
          url: 'https://www.revrobotics.com/rev-11-1107/',
        },
      ]),
    );

    await expect(fetchREVProducts()).rejects.toThrow(
      'expected string, received undefined',
    );
  });

  it('rejects a feed entry with a malformed url', async () => {
    mockedFetch.mockResolvedValueOnce(
      jsonResponse(200, [
        {
          sku: 'REV-11-1107',
          name: 'Analog Pressure Sensor',
          availability_status: 'Available',
          price: 39.42,
          url: 'not-a-url',
        },
      ]),
    );

    await expect(fetchREVProducts()).rejects.toThrow('Invalid URL');
  });

  it('rejects a payload that is not an array', async () => {
    mockedFetch.mockResolvedValueOnce(jsonResponse(200, { not: 'an array' }));

    await expect(fetchREVProducts()).rejects.toThrow(
      'expected array, received object',
    );
  });

  it('adapts valid feed entries into ShopifyProduct shape', async () => {
    mockedFetch.mockResolvedValueOnce(
      jsonResponse(200, [
        {
          sku: 'REV-21-1920',
          name: '20DP Gears - 1/2in Hex (18T - 1/2in Hex - 20DP Gear (REV-21-1920))',
          availability_status: 'Available',
          price: 11,
          url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
          image_url: 'https://example.com/image.png',
        },
      ]),
    );

    const products = await fetchREVProducts();

    expect(products).toHaveLength(1);
    const [product] = products;
    expect(product.title).toBe(
      '20DP Gears - 1/2in Hex (18T - 1/2in Hex - 20DP Gear (REV-21-1920))',
    );
    expect(product.handle).toBe(
      'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
    );
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0].sku).toBe('REV-21-1920');
    expect(product.variants[0].available).toBe(true);
  });

  it('marks out-of-stock entries as unavailable', async () => {
    mockedFetch.mockResolvedValueOnce(
      jsonResponse(200, [
        {
          sku: 'REV-41-1097',
          name: 'Smart Robot Servo',
          availability_status: 'Out of Stock',
          price: 25.5,
          url: 'https://www.revrobotics.com/rev-41-1097/',
        },
      ]),
    );

    const products = await fetchREVProducts();

    expect(products[0].variants[0].available).toBe(false);
  });

  it('produces stable ids across repeated fetches of the same entry', async () => {
    const entry = {
      sku: 'REV-21-1920',
      name: '20DP Gears - 1/2in Hex (18T - 1/2in Hex - 20DP Gear (REV-21-1920))',
      availability_status: 'Available',
      price: 11,
      url: 'https://www.revrobotics.com/20DP-Gears-0.5-Hex/',
    };
    mockedFetch
      .mockResolvedValueOnce(jsonResponse(200, [entry]))
      .mockResolvedValueOnce(jsonResponse(200, [entry]));

    const first = await fetchREVProducts();
    const second = await fetchREVProducts();

    expect(first[0].id).toBe(second[0].id);
    expect(first[0].variants[0].id).toBe(second[0].variants[0].id);
  });

  it('throws a descriptive error when the feed request fails', async () => {
    vi.useFakeTimers();
    try {
      mockedFetch.mockResolvedValue(jsonResponse(500, undefined));

      const result = fetchREVProducts();
      result.catch(() => {});
      await vi.runAllTimersAsync();
      await expect(result).rejects.toThrow('HTTP 500');
    } finally {
      vi.useRealTimers();
    }
  });
});
