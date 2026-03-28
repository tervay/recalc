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
import Gear from '~/lib/models/Gear';
import type { Bore, Vendor } from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';

const SKELETON_ROW_COUNT = 4;

export function GearTable({
  filterFn = () => true,
}: {
  filterFn?: (gear: Gear) => boolean;
}) {
  const [allGears, setAllGears] = useState<JSONGear[] | null>(null);
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

  return (
    <div className="overflow-hidden rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              colSpan={3}
              className="bg-primary/8 text-center font-semibold text-foreground"
            >
              <span>Matching COTS Gears</span>
              {allGears !== null && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {gears.length}
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
              Bore
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
              </TableRow>
            ))
          ) : gears.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                No matching gears found
              </TableCell>
            </TableRow>
          ) : (
            gears.map((gear, index) => {
              const prevGear = index > 0 ? gears[index - 1] : null;
              const isNewGroup =
                prevGear !== null && prevGear.teeth !== gear.teeth;

              const key =
                gear.sku ||
                `${gear.vendor}-${gear.teeth}-${gear.dp}-${gear.bore}`;

              return (
                <Fragment key={key}>
                  {isNewGroup && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={3}
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
                          {gear.sku || 'N/A'}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{gear.teeth}</TableCell>
                    <TableCell>
                      <BoreBadge bore={gear.bore} />
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
