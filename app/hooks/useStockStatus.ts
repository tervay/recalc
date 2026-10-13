import { useEffect, useState } from 'react';

import { fetchStock, type StockItem, type StockStatus } from '~/lib/stock';

export function useStockStatus(
  items: readonly StockItem[],
): Map<string, StockStatus> {
  const [statuses, setStatuses] = useState(new Map<string, StockStatus>());

  useEffect(() => {
    void fetchStock(items).then((fetched) => {
      setStatuses((previous) =>
        [...fetched].every(([key, status]) => previous.get(key) === status)
          ? previous
          : new Map([...previous, ...fetched]),
      );
    });
  }, [items]);

  return statuses;
}
