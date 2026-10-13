import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { BoreBadge } from '~/components/recalc/boreBadge';
import { InStockToggle } from '~/components/recalc/inStockToggle';
import { StockBadge } from '~/components/recalc/stockBadge';
import { VendorBadge } from '~/components/recalc/vendorBadge';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { useStockStatus } from '~/hooks/useStockStatus';
import Pulley from '~/lib/models/Pulley';
import { isUnavailable, stockKey } from '~/lib/stock';
import type { Bore, Vendor } from '~/lib/types/common';
import type { JSONPulley } from '~/lib/types/pulleys';

const SKELETON_ROW_COUNT = 4;

export function PulleyTable({
  filterFn = () => true,
}: {
  filterFn?: (pulley: Pulley) => boolean;
}) {
  const [allPulleys, setAllPulleys] = useState<JSONPulley[] | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  useEffect(() => {
    async function loadPulleys() {
      const [
        wcpPulleys,
        thriftyPulleys,
        revPulleys,
        andyMarkPulleys,
        lastAnvilPulleys,
      ] = await Promise.all([
        import('~/genData/WCP/pulleys.json').then((m) => m.default),
        import('~/genData/Thrifty/pulleys.json').then((m) => m.default),
        import('~/genData/REV/pulleys.json').then((m) => m.default),
        import('~/genData/AndyMark/pulleys.json').then((m) => m.default),
        import('~/genData/LastAnvil/pulleys.json').then((m) => m.default),
      ]);

      setAllPulleys(
        [
          ...wcpPulleys,
          ...thriftyPulleys,
          ...revPulleys,
          ...andyMarkPulleys,
          ...lastAnvilPulleys,
        ].map((p) => ({
          ...p,
          bore: p.bore as Bore,
          vendor: p.vendor as Vendor,
        })),
      );
    }
    void loadPulleys();
  }, []);

  const pulleys = useMemo(() => {
    if (!allPulleys) return [];
    return allPulleys
      .map((p) => Pulley.fromJson(p))
      .filter(filterFn)
      .sort(
        (a, b) =>
          a.teeth - b.teeth ||
          a.vendor.localeCompare(b.vendor) ||
          a.bore.localeCompare(b.bore) ||
          a.width.baseScalar - b.width.baseScalar,
      );
  }, [allPulleys, filterFn]);
  const stock = useStockStatus(pulleys);
  const shownPulleys = inStockOnly
    ? pulleys.filter((p) => !isUnavailable(stock.get(stockKey(p))))
    : pulleys;

  return (
    <div className="overflow-hidden rounded-md border shadow-sm">
      <Table className="min-w-xl table-fixed">
        <colgroup>
          <col />
          <col className="w-20" />
          <col className="w-20" />
          <col className="w-28" />
          <col className="w-28" />
        </colgroup>

        <TableHeader>
          <TableRow>
            <TableHead
              colSpan={5}
              className="bg-primary/8 font-semibold text-foreground"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <span className="col-start-2">
                  Matching COTS Pulleys
                  {allPulleys !== null && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {shownPulleys.length}
                    </span>
                  )}
                </span>
                <InStockToggle
                  checked={inStockOnly}
                  onCheckedChange={setInStockOnly}
                />
              </div>
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              SKU
            </TableHead>
            <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Teeth
            </TableHead>
            <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Width
            </TableHead>
            <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Bore
            </TableHead>
            <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Stock
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allPulleys === null ? (
            Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-12 rounded" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
              </TableRow>
            ))
          ) : shownPulleys.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                No matching pulleys found
              </TableCell>
            </TableRow>
          ) : (
            shownPulleys.map((pulley, index) => {
              const prevPulley = index > 0 ? shownPulleys[index - 1] : null;
              const isNewGroup =
                prevPulley !== null && prevPulley.teeth !== pulley.teeth;

              return (
                <Fragment key={pulley.sku}>
                  {isNewGroup && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="bg-muted/40 py-1 pl-3 text-xs font-semibold text-muted-foreground"
                      >
                        {pulley.teeth}T
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <VendorBadge
                          vendor={pulley.vendor as Vendor}
                          url={pulley.url}
                        />
                        <Link
                          to={pulley.url}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {pulley.sku}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {pulley.teeth}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {pulley.width.format()}
                    </TableCell>
                    <TableCell>
                      <BoreBadge bore={pulley.bore} />
                    </TableCell>
                    <TableCell>
                      <StockBadge status={stock.get(stockKey(pulley))} />
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
