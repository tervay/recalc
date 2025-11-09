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
import revBelts from '~/genData/REV/belts.json';
import swyftBelts from '~/genData/Swyft/belts.json';
import vbgBelts from '~/genData/VBeltGuys/belts.json';
import wcpBelts from '~/genData/WCP/belts.json';
import { Belt } from '~/lib/models/Belt';

export function BeltTable({
  filterFn = () => true,
}: {
  filterFn?: (belt: Belt) => boolean;
}) {
  const belts = useMemo(() => {
    return [...wcpBelts, ...swyftBelts, ...vbgBelts, ...revBelts]
      .map((b) => Belt.fromJson(b))
      .filter(filterFn)
      .sort(
        (a, b) =>
          a.teeth - b.teeth ||
          a.vendor.localeCompare(b.vendor) ||
          a.width.baseScalar - b.width.baseScalar,
      );
  }, [filterFn]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={5} className="text-center font-bold">
              Matching COTS Belts
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Pitch</TableHead>
            <TableHead>Teeth</TableHead>
            <TableHead>Width</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {belts.map((belt) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
