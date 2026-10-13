import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod';

type StockModule = typeof import('~/lib/stock');

interface VariantNode {
  availableForSale: boolean;
  currentlyNotInStock: boolean;
}

function stockResponse(nodes: (VariantNode | null)[]): Response {
  return new Response(JSON.stringify({ data: { nodes } }));
}

const IN_STOCK = { availableForSale: true, currentlyNotInStock: false };
const BACKORDER = { availableForSale: true, currentlyNotInStock: true };
const OUT_OF_STOCK = { availableForSale: false, currentlyNotInStock: false };

const zRequestBodySchema = z.object({
  variables: z.object({ ids: z.array(z.string()) }),
});

function requestedIds(init: RequestInit | undefined): string[] {
  const body = z.string().parse(init?.body);
  return zRequestBodySchema.parse(JSON.parse(body)).variables.ids;
}

describe('fetchStock', () => {
  let stock: StockModule;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(async () => {
    vi.resetModules();
    stock = await import('~/lib/stock');
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports an available variant as in stock', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([IN_STOCK]));
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('in-stock');
  });

  it('reports an available variant with no inventory as backorder', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([BACKORDER]));
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('backorder');
  });

  it('reports an unavailable variant as out of stock', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([OUT_OF_STOCK]));
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('out-of-stock');
  });

  it('reports a variant the store no longer has as unknown', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([null]));
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('unknown');
  });

  it('matches statuses to variants by response order', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([OUT_OF_STOCK, IN_STOCK]));
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
      { vendor: 'WCP', variantId: 2, sku: null },
    ]);
    expect([result.get('WCP:1'), result.get('WCP:2')]).toEqual([
      'out-of-stock',
      'in-stock',
    ]);
  });

  it('makes one request per vendor', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(stockResponse([IN_STOCK, IN_STOCK])),
    );
    await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
      { vendor: 'WCP', variantId: 2, sku: null },
      { vendor: 'Thrifty', variantId: 3, sku: null },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('queries the storefront API of the vendor store', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([IN_STOCK]));
    await stock.fetchStock([{ vendor: 'LastAnvil', variantId: 1, sku: null }]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://www.lastanvil.com/api/2026-10/graphql.json',
    );
  });

  it('sends variant ids as Shopify global ids', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([IN_STOCK, IN_STOCK]));
    await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
      { vendor: 'WCP', variantId: 2, sku: null },
    ]);
    expect(requestedIds(fetchMock.mock.calls[0][1])).toEqual([
      'gid://shopify/ProductVariant/1',
      'gid://shopify/ProductVariant/2',
    ]);
  });

  it('requests a repeated variant once', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([IN_STOCK]));
    await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(requestedIds(fetchMock.mock.calls[0][1])).toEqual([
      'gid://shopify/ProductVariant/1',
    ]);
  });

  it('does not query vendors without a stock source', async () => {
    await stock.fetchStock([{ vendor: 'Custom', variantId: 1, sku: 'C-1' }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports parts from vendors without a stock source as unknown', async () => {
    const result = await stock.fetchStock([
      { vendor: 'Custom', variantId: 1, sku: 'C-1' },
    ]);
    expect(result.get('Custom:1')).toBe('unknown');
  });

  it('does not query parts without a variant id', async () => {
    await stock.fetchStock([{ vendor: 'WCP', variantId: null, sku: null }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('makes no request for an empty list', async () => {
    await stock.fetchStock([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reuses statuses it already fetched', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([IN_STOCK]));
    await stock.fetchStock([{ vendor: 'WCP', variantId: 1, sku: null }]);
    await stock.fetchStock([{ vendor: 'WCP', variantId: 1, sku: null }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shares one request between overlapping calls', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([IN_STOCK]));
    await Promise.all([
      stock.fetchStock([{ vendor: 'WCP', variantId: 1, sku: null }]),
      stock.fetchStock([{ vendor: 'WCP', variantId: 1, sku: null }]),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('only requests variants it has not seen', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(stockResponse([IN_STOCK])),
    );
    await stock.fetchStock([{ vendor: 'WCP', variantId: 1, sku: null }]);
    await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
      { vendor: 'WCP', variantId: 2, sku: null },
    ]);
    expect(requestedIds(fetchMock.mock.calls[1][1])).toEqual([
      'gid://shopify/ProductVariant/2',
    ]);
  });

  it('splits more than 250 variants into several requests', async () => {
    fetchMock.mockImplementation((_, init) =>
      Promise.resolve(stockResponse(requestedIds(init).map(() => IN_STOCK))),
    );
    const items = Array.from({ length: 251 }, (_, i) => ({
      vendor: 'WCP',
      variantId: i + 1,
      sku: null,
    }));
    await stock.fetchStock(items);
    expect(
      fetchMock.mock.calls.map((call) => requestedIds(call[1]).length),
    ).toEqual([250, 1]);
  });

  it('reports unknown when the store returns an HTTP error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }));
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('unknown');
  });

  it('reports unknown when the store returns GraphQL errors', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: null, errors: [{ message: 'Throttled' }] }),
      ),
    );
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('unknown');
  });

  it('reports unknown when the response is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html></html>'));
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('unknown');
  });

  it('reports unknown when the response has fewer nodes than ids', async () => {
    fetchMock.mockResolvedValueOnce(stockResponse([IN_STOCK]));
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
      { vendor: 'WCP', variantId: 2, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('unknown');
  });

  it('reports unknown when the network request fails', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('unknown');
  });

  it('retries variants whose request failed', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(stockResponse([IN_STOCK]));
    await stock.fetchStock([{ vendor: 'WCP', variantId: 1, sku: null }]);
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
    ]);
    expect(result.get('WCP:1')).toBe('in-stock');
  });

  it('keeps other vendors when one vendor fails', async () => {
    fetchMock.mockImplementation((url) =>
      Promise.resolve(
        url === 'https://wcproducts.com/api/2026-10/graphql.json'
          ? new Response('', { status: 500 })
          : stockResponse([IN_STOCK]),
      ),
    );
    const result = await stock.fetchStock([
      { vendor: 'WCP', variantId: 1, sku: null },
      { vendor: 'SDS', variantId: 2, sku: null },
    ]);
    expect(result.get('SDS:2')).toBe('in-stock');
  });

  describe('REV', () => {
    const REV_FEED_URL =
      'https://dashboard.revrobotics.com/feeds/usa/products.json';

    function revFeed(
      entries: { sku: string; availability_status: string }[],
    ): Response {
      return new Response(
        JSON.stringify(
          entries.map((entry) => ({
            ...entry,
            name: entry.sku,
            price: 1,
            url: 'https://www.revrobotics.com/part/',
          })),
        ),
      );
    }

    function rev(sku: string) {
      return { vendor: 'REV', variantId: null, sku };
    }

    it('reports an available part as in stock', async () => {
      fetchMock.mockResolvedValueOnce(
        revFeed([{ sku: 'REV-1', availability_status: 'Available' }]),
      );
      const result = await stock.fetchStock([rev('REV-1')]);
      expect(result.get('REV:REV-1')).toBe('in-stock');
    });

    it('reports an out of stock part as out of stock', async () => {
      fetchMock.mockResolvedValueOnce(
        revFeed([{ sku: 'REV-1', availability_status: 'Out of Stock' }]),
      );
      const result = await stock.fetchStock([rev('REV-1')]);
      expect(result.get('REV:REV-1')).toBe('out-of-stock');
    });

    it('reports an unrecognized availability as unknown', async () => {
      fetchMock.mockResolvedValueOnce(
        revFeed([{ sku: 'REV-1', availability_status: 'Preorder' }]),
      );
      const result = await stock.fetchStock([rev('REV-1')]);
      expect(result.get('REV:REV-1')).toBe('unknown');
    });

    it('reports a part missing from the feed as unknown', async () => {
      fetchMock.mockResolvedValueOnce(
        revFeed([{ sku: 'REV-2', availability_status: 'Available' }]),
      );
      const result = await stock.fetchStock([rev('REV-1')]);
      expect(result.get('REV:REV-1')).toBe('unknown');
    });

    it('reports a part without a sku as unknown', async () => {
      const result = await stock.fetchStock([
        { vendor: 'REV', variantId: null, sku: null },
      ]);
      expect(result.get('REV:null')).toBe('unknown');
    });

    it('matches each part to its own sku', async () => {
      fetchMock.mockResolvedValueOnce(
        revFeed([
          { sku: 'REV-1', availability_status: 'Available' },
          { sku: 'REV-2', availability_status: 'Out of Stock' },
        ]),
      );
      const result = await stock.fetchStock([rev('REV-1'), rev('REV-2')]);
      expect([result.get('REV:REV-1'), result.get('REV:REV-2')]).toEqual([
        'in-stock',
        'out-of-stock',
      ]);
    });

    it('reads stock from the REV product feed', async () => {
      fetchMock.mockResolvedValueOnce(revFeed([]));
      await stock.fetchStock([rev('REV-1')]);
      expect(fetchMock.mock.calls[0][0]).toBe(REV_FEED_URL);
    });

    it('downloads the feed once for many parts', async () => {
      fetchMock.mockResolvedValueOnce(revFeed([]));
      await stock.fetchStock([rev('REV-1'), rev('REV-2')]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('reuses the feed for parts it has not seen', async () => {
      fetchMock.mockResolvedValueOnce(
        revFeed([
          { sku: 'REV-1', availability_status: 'Available' },
          { sku: 'REV-2', availability_status: 'Available' },
        ]),
      );
      await stock.fetchStock([rev('REV-1')]);
      await stock.fetchStock([rev('REV-2')]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('reports unknown when the feed request fails', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      const result = await stock.fetchStock([rev('REV-1')]);
      expect(result.get('REV:REV-1')).toBe('unknown');
    });

    it('reports unknown when the feed returns an HTTP error', async () => {
      fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
      const result = await stock.fetchStock([rev('REV-1')]);
      expect(result.get('REV:REV-1')).toBe('unknown');
    });

    it('reports unknown when the feed is malformed', async () => {
      fetchMock.mockResolvedValueOnce(new Response('{"products": []}'));
      const result = await stock.fetchStock([rev('REV-1')]);
      expect(result.get('REV:REV-1')).toBe('unknown');
    });

    it('retries the feed after a failed download', async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(
          revFeed([{ sku: 'REV-1', availability_status: 'Available' }]),
        );
      await stock.fetchStock([rev('REV-1')]);
      const result = await stock.fetchStock([rev('REV-1')]);
      expect(result.get('REV:REV-1')).toBe('in-stock');
    });

    it('fetches REV and Shopify stock together', async () => {
      fetchMock.mockImplementation((url) =>
        Promise.resolve(
          url === REV_FEED_URL
            ? revFeed([{ sku: 'REV-1', availability_status: 'Available' }])
            : stockResponse([OUT_OF_STOCK]),
        ),
      );
      const result = await stock.fetchStock([
        rev('REV-1'),
        { vendor: 'WCP', variantId: 1, sku: null },
      ]);
      expect([result.get('REV:REV-1'), result.get('WCP:1')]).toEqual([
        'in-stock',
        'out-of-stock',
      ]);
    });
  });
});

describe('isUnavailable', () => {
  it.each([
    ['backorder', true],
    ['out-of-stock', true],
    ['in-stock', false],
    ['unknown', false],
    [undefined, false],
  ] as const)('returns %s -> %s', async (status, expected) => {
    const { isUnavailable } = await import('~/lib/stock');
    expect(isUnavailable(status)).toBe(expected);
  });
});
