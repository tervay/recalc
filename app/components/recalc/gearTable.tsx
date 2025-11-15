import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import Gear from '~/lib/models/Gear';
import type { Bore } from '~/lib/types/common';
import type { JSONGear } from '~/lib/types/gears';

export function GearTable({
  filterFn = () => true,
}: {
  filterFn?: (gear: Gear) => boolean;
}) {
  const [allGears, setAllGears] = useState<JSONGear[] | null>(null);
  useEffect(() => {
    async function loadGears() {
      const [wcpGears, revGears] = await Promise.all([
        import('~/genData/WCP/gears.json').then((m) => m.default),
        import('~/genData/REV/gears.json').then((m) => m.default),
      ]);
      setAllGears(
        [...wcpGears, ...revGears].map((g) => ({
          ...g,
          bore: g.bore as Bore,
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={5} className="bg-blue-50 text-center font-bold">
              Matching COTS Gears
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="bg-blue-50/50">SKU</TableHead>
            <TableHead className="bg-blue-50/50">Teeth</TableHead>
            <TableHead className="bg-blue-50/50">Bore</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allGears === null ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : gears.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No matching gears found
              </TableCell>
            </TableRow>
          ) : (
            gears.map((gear) => (
              <TableRow
                key={
                  gear.sku ||
                  `${gear.vendor}-${gear.teeth}-${gear.dp}-${gear.bore}`
                }
              >
                <TableCell className="font-medium">
                  <Link to={gear.url}>
                    {gear.vendor} - {gear.sku || 'N/A'}
                  </Link>
                </TableCell>
                <TableCell>{gear.teeth}</TableCell>
                <TableCell>{gear.bore}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
