import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { BoreBadge } from '~/components/recalc/boreBadge';
import { VendorBadge } from '~/components/recalc/vendorBadge';
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
        (a, b) =>
          a.teeth - b.teeth ||
          a.vendor.localeCompare(b.vendor) ||
          a.bore.localeCompare(b.bore) ||
          a.width.baseScalar - b.width.baseScalar,
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
            <TableHead className="bg-blue-50/50">Teeth</TableHead>
            <TableHead className="bg-blue-50/50">Width</TableHead>
            <TableHead className="bg-blue-50/50">Bore</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pulleys.map((pulley, index) => {
            const prevPulley = index > 0 ? pulleys[index - 1] : null;
            const showDivider =
              prevPulley !== null && prevPulley.teeth !== pulley.teeth;

            return (
              <>
                {showDivider && (
                  <TableRow key={`divider-${pulley.teeth}`}>
                    <TableCell colSpan={4} className="h-px p-0">
                      <div className="h-px bg-border" />
                    </TableCell>
                  </TableRow>
                )}
                <TableRow key={pulley.sku}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <VendorBadge vendor={pulley.vendor} url={pulley.url} />
                      <Link to={pulley.url}>{pulley.sku}</Link>
                    </div>
                  </TableCell>
                  <TableCell>{pulley.teeth}</TableCell>
                  <TableCell>{pulley.width.toString()}</TableCell>
                  <TableCell>
                    <BoreBadge bore={pulley.bore} />
                  </TableCell>
                </TableRow>
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
