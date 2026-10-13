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
import Gear from '~/lib/models/Gear';
import { isUnavailable, stockKey } from '~/lib/stock';
import type { Bore, Vendor } from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';

const SKELETON_ROW_COUNT = 4;

export function GearTable({
  filterFn = () => true,
}: {
  filterFn?: (gear: Gear) => boolean;
}) {
  const [allGears, setAllGears] = useState<JSONGear[] | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  useEffect(() => {
    async function loadGears() {
      const [wcpGears, revGears, sdsGears, andyMarkGears] = await Promise.all([
        import('~/genData/WCP/gears.json').then((m) => m.default),
        import('~/genData/REV/gears.json').then((m) => m.default),
        import('~/genData/SDS/gears.json').then((m) => m.default),
        import('~/genData/AndyMark/gears.json').then((m) => m.default),
      ]);
      setAllGears(
        [...wcpGears, ...revGears, ...sdsGears, ...andyMarkGears].map((g) => ({
          ...g,
          bore: g.bore as Bore,
          vendor: g.vendor as Vendor,
        })),
      );
    }
    void loadGears();
  }, []);

  const gears = useMemo(() => {
    if (!allGears) return [];
    return allGears
      .map((g) => Gear.fromJson(g))
      .filter(filterFn)
      .sort(
        (a, b) =>
          a.teeth - b.teeth ||
          a.dp - b.dp ||
          a.bore.localeCompare(b.bore) ||
          a.vendor.localeCompare(b.vendor),
      );
  }, [allGears, filterFn]);
  const stock = useStockStatus(gears);
  const shownGears = inStockOnly
    ? gears.filter((g) => !isUnavailable(stock.get(stockKey(g))))
    : gears;

  return (
    <div className="overflow-hidden rounded-md border shadow-sm">
      <Table className="min-w-xl table-fixed">
        <colgroup>
          <col />
          <col className="w-20" />
          <col className="w-28" />
          <col className="w-28" />
        </colgroup>

        <TableHeader>
          <TableRow>
            <TableHead
              colSpan={4}
              className="bg-primary/8 font-semibold text-foreground"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <span className="col-start-2">
                  Matching COTS Gears
                  {allGears !== null && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {shownGears.length}
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
              Bore
            </TableHead>
            <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Stock
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allGears === null ? (
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
              </TableRow>
            ))
          ) : shownGears.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                No matching gears found
              </TableCell>
            </TableRow>
          ) : (
            shownGears.map((gear, index) => {
              const prevGear = index > 0 ? shownGears[index - 1] : null;
              const isNewGroup =
                prevGear !== null && prevGear.teeth !== gear.teeth;

              // Vendor data can have an empty-string sku, which should fall
              // back to the generated key the same as a missing (null) one.
              const key =
                // oxlint-disable-next-line typescript/prefer-nullish-coalescing
                gear.sku ||
                `${gear.vendor}-${gear.teeth}-${gear.dp}-${gear.bore}`;

              return (
                <Fragment key={key}>
                  {isNewGroup && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={4}
                        className="bg-muted/40 py-1 pl-3 text-xs font-semibold text-muted-foreground"
                      >
                        {gear.teeth}T
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <VendorBadge
                          vendor={gear.vendor as Vendor}
                          url={gear.url}
                        />
                        <Link
                          to={gear.url}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {
                            // oxlint-disable-next-line typescript/prefer-nullish-coalescing
                            gear.sku || 'N/A'
                          }
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{gear.teeth}</TableCell>
                    <TableCell>
                      <BoreBadge bore={gear.bore} />
                    </TableCell>
                    <TableCell>
                      <StockBadge status={stock.get(stockKey(gear))} />
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
