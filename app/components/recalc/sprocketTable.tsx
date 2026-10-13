import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { BoreBadge } from '~/components/recalc/boreBadge';
import { InStockToggle } from '~/components/recalc/inStockToggle';
import { StockBadge } from '~/components/recalc/stockBadge';
import { VendorBadge } from '~/components/recalc/vendorBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { useStockStatus } from '~/hooks/useStockStatus';
import Sprocket from '~/lib/models/Sprocket';
import { withVariant } from '~/lib/productUrl';
import { isUnavailable, stockKey } from '~/lib/stock';
import type { Bore, Vendor } from '~/lib/types/common';
import type { ChainType, JSONSprocket } from '~/lib/types/sprockets';

export function SprocketTable({
  filterFn = () => true,
}: {
  filterFn?: (sprocket: Sprocket) => boolean;
}) {
  const [allSprockets, setAllSprockets] = useState<JSONSprocket[] | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  useEffect(() => {
    async function loadSprockets() {
      const [
        wcpSprockets,
        thriftySprockets,
        revSprockets,
        andyMarkSprockets,
        lastAnvilSprockets,
      ] = await Promise.all([
        import('~/genData/WCP/sprockets.json').then((m) => m.default),
        import('~/genData/Thrifty/sprockets.json').then((m) => m.default),
        import('~/genData/REV/sprockets.json').then((m) => m.default),
        import('~/genData/AndyMark/sprockets.json').then((m) => m.default),
        import('~/genData/LastAnvil/sprockets.json').then((m) => m.default),
      ]);
      setAllSprockets(
        [
          ...wcpSprockets,
          ...thriftySprockets,
          ...revSprockets,
          ...andyMarkSprockets,
          ...lastAnvilSprockets,
        ].map((s) => ({
          ...s,
          bore: s.bore as Bore,
          chainType: s.chainType as ChainType,
          vendor: s.vendor as Vendor,
        })),
      );
    }
    void loadSprockets();
  }, []);

  const sprockets = useMemo(() => {
    if (!allSprockets) return [];
    return allSprockets
      .map((s) => Sprocket.fromJson(s))
      .filter(filterFn)
      .sort(
        (a, b) =>
          a.teeth - b.teeth ||
          a.bore.localeCompare(b.bore) ||
          a.vendor.localeCompare(b.vendor) ||
          (a.sku ?? '').localeCompare(b.sku ?? ''),
      );
  }, [allSprockets, filterFn]);
  const stock = useStockStatus(sprockets);
  const shownSprockets = inStockOnly
    ? sprockets.filter((s) => !isUnavailable(stock.get(stockKey(s))))
    : sprockets;

  return (
    <div className="rounded-md border">
      <Table className="min-w-xl table-fixed">
        <colgroup>
          <col />
          <col className="w-20" />
          <col className="w-28" />
          <col className="w-28" />
        </colgroup>

        <TableHeader>
          <TableRow>
            <TableHead colSpan={4} className="bg-blue-50 font-bold">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <span className="col-start-2">Matching COTS Sprockets</span>
                <InStockToggle
                  checked={inStockOnly}
                  onCheckedChange={setInStockOnly}
                />
              </div>
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="bg-blue-50/50">SKU</TableHead>
            <TableHead className="bg-blue-50/50">Teeth</TableHead>
            <TableHead className="bg-blue-50/50">Bore</TableHead>
            <TableHead className="bg-blue-50/50">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shownSprockets.map((sprocket, index) => {
            const prevSprocket = index > 0 ? shownSprockets[index - 1] : null;
            const showDivider =
              prevSprocket !== null && prevSprocket.teeth !== sprocket.teeth;
            const url = withVariant(sprocket.url, sprocket.variantId);

            return (
              <>
                {showDivider && (
                  <TableRow key={`divider-${sprocket.teeth}`}>
                    <TableCell colSpan={4} className="h-px p-0">
                      <div className="h-px bg-border" />
                    </TableCell>
                  </TableRow>
                )}
                <TableRow key={sprocket.sku}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <VendorBadge
                        vendor={sprocket.vendor as Vendor}
                        url={url}
                      />
                      <Link to={url}>{sprocket.sku}</Link>
                    </div>
                  </TableCell>
                  <TableCell>{sprocket.teeth}</TableCell>
                  <TableCell>
                    <BoreBadge bore={sprocket.bore} />
                  </TableCell>
                  <TableCell>
                    <StockBadge status={stock.get(stockKey(sprocket))} />
                  </TableCell>
                </TableRow>
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
