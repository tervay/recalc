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
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import Wheel from '~/lib/models/Wheel';
import {
  compareWheelBores,
  zJSONWheelSchema,
  zWheelBoreSchema,
} from '~/lib/types/wheels';
import type { JSONWheel, WheelBore } from '~/lib/types/wheels';

const SKELETON_ROW_COUNT = 4;

export function WheelTable({
  filterFn = () => true,
}: {
  filterFn?: (wheel: Wheel) => boolean;
}) {
  const [allWheels, setAllWheels] = useState<JSONWheel[] | null>(null);
  const [selectedBores, setSelectedBores] = useState<WheelBore[]>([]);
  useEffect(() => {
    async function loadWheels() {
      const byVendor = await Promise.all([
        import('~/genData/WCP/wheels.json').then((m) => m.default),
        import('~/genData/AndyMark/wheels.json').then((m) => m.default),
        import('~/genData/REV/wheels.json').then((m) => m.default),
        import('~/genData/Thrifty/wheels.json').then((m) => m.default),
        import('~/genData/Swyft/wheels.json').then((m) => m.default),
      ]);
      setAllWheels(zJSONWheelSchema.array().parse(byVendor.flat()));
    }
    void loadWheels();
  }, []);

  const availableBores = useMemo(() => {
    if (!allWheels) return [];
    return [...new Set(allWheels.map((w) => w.bore))].sort(compareWheelBores);
  }, [allWheels]);

  const wheels = useMemo(() => {
    if (!allWheels) return [];
    return allWheels
      .map((w) => Wheel.fromJson(w))
      .filter(filterFn)
      .filter(
        (w) => selectedBores.length === 0 || selectedBores.includes(w.bore),
      )
      .sort(
        (a, b) =>
          a.diameter.baseScalar - b.diameter.baseScalar ||
          a.vendor.localeCompare(b.vendor) ||
          a.name.localeCompare(b.name) ||
          compareWheelBores(a.bore, b.bore) ||
          (a.durometer ?? '').localeCompare(b.durometer ?? ''),
      );
  }, [allWheels, filterFn, selectedBores]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Bore
        </span>
        <ToggleGroup
          multiple
          size="sm"
          variant="outline"
          className="w-auto min-w-0 flex-1 flex-wrap"
          value={selectedBores}
          onValueChange={(value) =>
            setSelectedBores(zWheelBoreSchema.array().parse(value))
          }
          aria-label="Filter wheels by bore"
        >
          {availableBores.map((bore) => (
            <ToggleGroupItem
              key={bore}
              value={bore}
              aria-label={bore}
              className="cursor-pointer aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground hover:aria-pressed:bg-primary/90 data-pressed:border-primary data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              {bore}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="overflow-hidden rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                colSpan={5}
                className="bg-primary/8 text-center font-semibold text-foreground"
              >
                <span>Matching COTS Wheels</span>
                {allWheels !== null && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {wheels.length}
                  </span>
                )}
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Wheel
              </TableHead>
              <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Diameter
              </TableHead>
              <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Bore
              </TableHead>
              <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Type
              </TableHead>
              <TableHead className="bg-primary/4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Durometer
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allWheels === null ? (
              Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-12 rounded" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-14" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : wheels.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No matching wheels found
                </TableCell>
              </TableRow>
            ) : (
              wheels.map((wheel, index) => {
                const prevWheel = index > 0 ? wheels[index - 1] : null;
                const isNewGroup =
                  prevWheel !== null && !prevWheel.diameter.eq(wheel.diameter);
                const diameterLabel = `${wheel.diameter.to('in').scalar.toFixed(2)}"`;

                const key =
                  wheel.sku ??
                  `${wheel.vendor}-${wheel.name}-${wheel.diameter.baseScalar}-${wheel.bore}-${wheel.durometer}`;

                return (
                  <Fragment key={key}>
                    {isNewGroup && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={5}
                          className="bg-muted/40 py-1 pl-3 text-xs font-semibold text-muted-foreground"
                        >
                          {diameterLabel}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="hover:bg-muted/40">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <VendorBadge vendor={wheel.vendor} url={wheel.url} />
                          <div className="flex flex-col">
                            <Link
                              to={wheel.url}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              {wheel.name}
                            </Link>
                            {wheel.sku !== null && (
                              <span className="font-mono text-xs text-muted-foreground">
                                {wheel.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {diameterLabel}
                      </TableCell>
                      <TableCell>
                        <BoreBadge bore={wheel.bore} />
                      </TableCell>
                      <TableCell>{wheel.type}</TableCell>
                      <TableCell className="tabular-nums">
                        {wheel.durometer ?? '\u2014'}
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
