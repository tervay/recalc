import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { BoreBadge } from '~/components/recalc/boreBadge';
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
import Pulley from '~/lib/models/Pulley';
import type { Bore, Vendor } from '~/lib/types/common';
import type { JSONPulley } from '~/lib/types/pulleys';

const SKELETON_ROW_COUNT = 4;

export function PulleyTable({
  filterFn = () => true,
}: {
  filterFn?: (pulley: Pulley) => boolean;
}) {
  const [allPulleys, setAllPulleys] = useState<JSONPulley[] | null>(null);
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

  return (
    <div className="overflow-hidden rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              colSpan={4}
              className="bg-primary/8 text-center font-semibold text-foreground"
            >
              <span>Matching COTS Pulleys</span>
              {allPulleys !== null && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {pulleys.length}
                </span>
              )}
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
              </TableRow>
            ))
          ) : pulleys.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                No matching pulleys found
              </TableCell>
            </TableRow>
          ) : (
            pulleys.map((pulley, index) => {
              const prevPulley = index > 0 ? pulleys[index - 1] : null;
              const isNewGroup =
                prevPulley !== null && prevPulley.teeth !== pulley.teeth;

              return (
                <Fragment key={pulley.sku}>
                  {isNewGroup && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={4}
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
