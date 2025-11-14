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
import Pulley from '~/lib/models/Pulley';
import type { Bore } from '~/lib/types/common';
import type { JSONPulley } from '~/lib/types/pulleys';

export function PulleyTable({
  filterFn = () => true,
}: {
  filterFn?: (pulley: Pulley) => boolean;
}) {
  const [allPulleys, setAllPulleys] = useState<JSONPulley[] | null>(null);
  useEffect(() => {
    async function loadPulleys() {
      const [wcpPulleys, thriftyPulleys, revPulleys, andyMarkPulleys] =
        await Promise.all([
          import('~/genData/WCP/pulleys.json').then((m) => m.default),
          import('~/genData/Thrifty/pulleys.json').then((m) => m.default),
          import('~/genData/REV/pulleys.json').then((m) => m.default),
          import('~/genData/AndyMark/pulleys.json').then((m) => m.default),
        ]);

      setAllPulleys(
        [
          ...wcpPulleys,
          ...thriftyPulleys,
          ...revPulleys,
          ...andyMarkPulleys,
        ].map((p) => ({ ...p, bore: p.bore as Bore })),
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
        (a, b) => a.teeth - b.teeth || a.width.baseScalar - b.width.baseScalar,
      );
  }, [allPulleys, filterFn]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={6} className="bg-blue-50 text-center font-bold">
              Matching COTS Pulleys
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="bg-blue-50/50">SKU</TableHead>
            <TableHead className="bg-blue-50/50">Type</TableHead>
            <TableHead className="bg-blue-50/50">Pitch</TableHead>
            <TableHead className="bg-blue-50/50">Teeth</TableHead>
            <TableHead className="bg-blue-50/50">Width</TableHead>
            <TableHead className="bg-blue-50/50">Bore</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pulleys.map((pulley) => (
            <TableRow key={pulley.sku}>
              <TableCell className="font-medium">
                <Link to={pulley.url}>
                  {pulley.vendor} - {pulley.sku}
                </Link>
              </TableCell>
              <TableCell>{pulley.profile}</TableCell>
              <TableCell>{pulley.pitch.toString()}</TableCell>
              <TableCell>{pulley.teeth}</TableCell>
              <TableCell>{pulley.width.toString()}</TableCell>
              <TableCell>{pulley.bore}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
