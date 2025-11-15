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
import { Belt } from '~/lib/models/Belt';
import type { JSONBelt } from '~/lib/types/belts';

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
      ] = await Promise.all([
        import('~/genData/WCP/belts.json').then((m) => m.default),
        import('~/genData/Swyft/belts.json').then((m) => m.default),
        import('~/genData/VBeltGuys/belts.json').then((m) => m.default),
        import('~/genData/REV/belts.json').then((m) => m.default),
        import('~/genData/AndyMark/belts.json').then((m) => m.default),
        import('~/genData/LastAnvil/belts.json').then((m) => m.default),
      ]);
      setAllBelts([
        ...wcpBelts,
        ...swyftBelts,
        ...vbgBelts,
        ...revBelts,
        ...andyMarkBelts,
        ...lastAnvilBelts,
      ]);
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={5} className="bg-blue-50 text-center font-bold">
              Matching COTS Belts
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="bg-blue-50/50">SKU</TableHead>
            <TableHead className="bg-blue-50/50">Type</TableHead>
            <TableHead className="bg-blue-50/50">Pitch</TableHead>
            <TableHead className="bg-blue-50/50">Teeth</TableHead>
            <TableHead className="bg-blue-50/50">Width</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allBelts === null ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : belts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No matching belts found
              </TableCell>
            </TableRow>
          ) : (
            belts.map((belt) => (
              <TableRow key={belt.sku}>
                <TableCell className="font-medium">
                  <Link to={belt.url}>
                    {belt.vendor} - {belt.sku}
                  </Link>
                </TableCell>
                <TableCell>{belt.profile}</TableCell>
                <TableCell>{belt.pitch.format()}</TableCell>
                <TableCell>{belt.teeth}</TableCell>
                <TableCell>{belt.width.format()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
