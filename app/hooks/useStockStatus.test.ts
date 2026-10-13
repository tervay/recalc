// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useStockStatus } from '~/hooks/useStockStatus';
import { fetchStock, type StockItem } from '~/lib/stock';

vi.mock('~/lib/stock', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/lib/stock')>()),
  fetchStock: vi.fn<typeof fetchStock>(),
}));

const fetchStockMock = vi.mocked(fetchStock);

const WCP_1: StockItem = { vendor: 'WCP', variantId: 1, sku: null };
const WCP_2: StockItem = { vendor: 'WCP', variantId: 2, sku: null };

describe('useStockStatus', () => {
  beforeEach(() => {
    fetchStockMock.mockReset();
  });

  it('has no statuses before the lookup finishes', () => {
    fetchStockMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useStockStatus([WCP_1]));
    expect(result.current.size).toBe(0);
  });

  it('returns statuses once the lookup finishes', async () => {
    fetchStockMock.mockResolvedValue(new Map([['WCP:1', 'in-stock']]));
    const { result } = renderHook(() => useStockStatus([WCP_1]));
    await waitFor(() => expect(result.current.get('WCP:1')).toBe('in-stock'));
  });

  it('settles when given a new array with the same items each render', async () => {
    fetchStockMock.mockResolvedValue(new Map([['WCP:1', 'in-stock']]));
    const { result } = renderHook(() => useStockStatus([WCP_1]));
    await waitFor(() => expect(result.current.get('WCP:1')).toBe('in-stock'));
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(fetchStockMock).toHaveBeenCalledTimes(2);
  });

  it('looks up the items it is given', () => {
    fetchStockMock.mockReturnValue(new Promise(() => {}));
    renderHook(() => useStockStatus([WCP_1, WCP_2]));
    expect(fetchStockMock).toHaveBeenCalledWith([WCP_1, WCP_2]);
  });

  it('looks up new items when the list changes', () => {
    fetchStockMock.mockReturnValue(new Promise(() => {}));
    const { rerender } = renderHook(({ items }) => useStockStatus(items), {
      initialProps: { items: [WCP_1] },
    });
    rerender({ items: [WCP_2] });
    expect(fetchStockMock).toHaveBeenLastCalledWith([WCP_2]);
  });

  it('keeps earlier statuses when the list changes', async () => {
    fetchStockMock
      .mockResolvedValueOnce(new Map([['WCP:1', 'in-stock']]))
      .mockResolvedValueOnce(new Map([['WCP:2', 'backorder']]));
    const { result, rerender } = renderHook(
      ({ items }) => useStockStatus(items),
      { initialProps: { items: [WCP_1] } },
    );
    await waitFor(() => expect(result.current.get('WCP:1')).toBe('in-stock'));
    rerender({ items: [WCP_2] });
    await waitFor(() => expect(result.current.get('WCP:2')).toBe('backorder'));
    expect(result.current.get('WCP:1')).toBe('in-stock');
  });
});
