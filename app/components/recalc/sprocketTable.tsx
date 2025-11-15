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
import Sprocket from '~/lib/models/Sprocket';
import type { Bore } from '~/lib/types/common';
import type { ChainType, JSONSprocket } from '~/lib/types/sprockets';

export function SprocketTable({
  filterFn = () => true,
}: {
  filterFn?: (sprocket: Sprocket) => boolean;
}) {
  const [allSprockets, setAllSprockets] = useState<JSONSprocket[] | null>(null);
  useEffect(() => {
    async function loadSprockets() {
      const [wcpSprockets, thriftySprockets, revSprockets, andyMarkSprockets] =
        await Promise.all([
          import('~/genData/WCP/sprockets.json').then((m) => m.default),
          import('~/genData/Thrifty/sprockets.json').then((m) => m.default),
          import('~/genData/REV/sprockets.json').then((m) => m.default),
          import('~/genData/AndyMark/sprockets.json').then((m) => m.default),
        ]);
      setAllSprockets(
        [
          ...wcpSprockets,
          ...thriftySprockets,
          ...revSprockets,
          ...andyMarkSprockets,
        ].map((s) => ({
          ...s,
          bore: s.bore as Bore,
          chainType: s.chainType as ChainType,
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={6} className="bg-blue-50 text-center font-bold">
              Matching COTS Sprockets
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="bg-blue-50/50">SKU</TableHead>
            <TableHead className="bg-blue-50/50">Teeth</TableHead>
            <TableHead className="bg-blue-50/50">Bore</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sprockets.map((sprocket) => (
            <TableRow key={sprocket.sku}>
              <TableCell className="font-medium">
                <Link to={sprocket.url}>
                  {sprocket.vendor} - {sprocket.sku}
                </Link>
              </TableCell>
              <TableCell>{sprocket.teeth}</TableCell>
              <TableCell>{sprocket.bore}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
