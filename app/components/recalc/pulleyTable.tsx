import { useMemo } from 'react';
import { Link } from 'react-router';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import revPulleys from '~/genData/REV/pulleys.json';
import thriftyPulleys from '~/genData/Thrifty/pulleys.json';
import wcpPulleys from '~/genData/WCP/pulleys.json';
import Pulley from '~/lib/models/Pulley';
import type { Bore } from '~/lib/types/common';

export function PulleyTable({
  filterFn = () => true,
}: {
  filterFn?: (pulley: Pulley) => boolean;
}) {
  const pulleys = useMemo(() => {
    return [...wcpPulleys, ...thriftyPulleys, ...revPulleys]
      .map((p) => {
        const pulleyData = {
          ...p,
          bore: p.bore as Bore,
        };
        return Pulley.fromJson(pulleyData);
      })
      .filter(filterFn)
      .sort(
        (a, b) => a.teeth - b.teeth || a.width.baseScalar - b.width.baseScalar,
      );
  }, [filterFn]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={6} className="text-center font-bold">
              Matching COTS Pulleys
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Pitch</TableHead>
            <TableHead>Teeth</TableHead>
            <TableHead>Width</TableHead>
            <TableHead>Bore</TableHead>
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
