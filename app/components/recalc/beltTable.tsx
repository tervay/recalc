import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

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
import { Belt } from '~/lib/models/Belt';
import { type JSONBelt, zJSONBeltSchema } from '~/lib/types/belts';
import type { Vendor } from '~/lib/types/common';

const SKELETON_ROW_COUNT = 4;

export function BeltTable({
  filterFn = () => true,
}: {
  filterFn?: (belt: Belt) => boolean;
}) {
  const [allBelts, setAllBelts] = useState<JSONBelt[] | null>(null);

  useEffect(() => {
    async function loadBelts() {
      const [
        wcpBelts,
        swyftBelts,
        vbgBelts,
        revBelts,
        andyMarkBelts,
        lastAnvilBelts,
        sdsBelts,
        thriftyBelts,
      ] = await Promise.all([
        import('~/genData/WCP/belts.json').then((m) => m.default),
        import('~/genData/Swyft/belts.json').then((m) => m.default),
        import('~/genData/VBeltGuys/belts.json').then((m) => m.default),
        import('~/genData/REV/belts.json').then((m) => m.default),
        import('~/genData/AndyMark/belts.json').then((m) => m.default),
        import('~/genData/LastAnvil/belts.json').then((m) => m.default),
        import('~/genData/SDS/belts.json').then((m) => m.default),
        import('~/genData/Thrifty/belts.json').then((m) => m.default),
      ]);
      setAllBelts(
        zJSONBeltSchema
          .array()
          .parse([
            ...wcpBelts,
            ...swyftBelts,
            ...vbgBelts,
            ...revBelts,
            ...andyMarkBelts,
            ...lastAnvilBelts,
            ...sdsBelts,
            ...thriftyBelts,
          ]),
      );
    }
    void loadBelts();
  }, []);

  const belts = useMemo(() => {
    if (!allBelts) return [];
    return allBelts
      .map((b) => Belt.fromJson(b))
      .filter(filterFn)
      .sort(
        (a, b) =>
          a.teeth - b.teeth ||
          a.vendor.localeCompare(b.vendor) ||
          a.width.baseScalar - b.width.baseScalar,
      );
  }, [allBelts, filterFn]);

  return (
    <div className="overflow-hidden rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              colSpan={3}
              className="bg-primary/8 text-center font-semibold text-foreground"
            >
              <span>Matching COTS Belts</span>
              {allBelts !== null && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {belts.length}
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {allBelts === null ? (
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
          ) : belts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="py-6 text-center text-sm text-muted-foreground"
              >
                No matching belts found
              </TableCell>
            </TableRow>
          ) : (
            belts.map((belt, index) => {
              const prevBelt = index > 0 ? belts[index - 1] : null;
              const isNewGroup =
                prevBelt !== null && prevBelt.teeth !== belt.teeth;

              const defaultSku = `${belt.vendor}-${belt.teeth}T-${belt.width.format().replace(' ', '')}`;
              const sku = belt.sku || defaultSku;

              return (
                <Fragment key={sku}>
                  {isNewGroup && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={3}
                        className="bg-muted/40 py-1 pl-3 text-xs font-semibold text-muted-foreground"
                      >
                        {belt.teeth}T
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <VendorBadge
                          vendor={belt.vendor as Vendor}
                          url={belt.url}
                        />
                        <Link
                          to={belt.url}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {sku}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{belt.teeth}</TableCell>
                    <TableCell className="tabular-nums">
                      {belt.width.format()}
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
