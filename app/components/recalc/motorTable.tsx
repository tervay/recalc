import {
  type Column,
  type ColumnDef,
  type SortingState,
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { type ReactNode, useMemo, useState } from 'react';
import ArrowDownIcon from '~icons/lucide/arrow-down';
import ArrowUpIcon from '~icons/lucide/arrow-up';
import ChevronsUpDownIcon from '~icons/lucide/chevrons-up-down';

import { MeasurementInput } from '~/components/recalc/io/measurement';
import { VendorBadge } from '~/components/recalc/vendorBadge';
import { Button } from '~/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import Measurement from '~/lib/models/Measurement';
import {
  ALL_MOTORS,
  type FullMotorSpecs,
  completeMotorSpecs,
} from '~/lib/models/Motor';
import Motor from '~/lib/models/Motor';
import { cn } from '~/lib/utils';

type MotorRow = { motor: Motor; motorSpecs: FullMotorSpecs };

// Only sorting is registered, so everything else the library offers (filtering,
// pagination, selection, column visibility) tree-shakes out of the bundle. The
// two sort functions are what auto-detection resolves for the string columns;
// numeric columns fall back to the built-in basic comparison.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
  },
});

/**
 * A column header button that toggles sorting and shows the current sort
 * direction. `align` matches the cell text alignment so the header lines up
 * with the values below it.
 */
function SortableHeader({
  column,
  align = 'right',
  children,
}: {
  column: Column<typeof features, MotorRow>;
  align?: 'left' | 'right' | 'center';
  children: ReactNode;
}) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className={cn(
        'cursor-pointer gap-1 p-0 hover:bg-transparent',
        align === 'right' && 'ml-auto flex',
        align === 'center' && 'mx-auto flex',
      )}
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUpIcon className="size-3.5" />
      ) : sorted === 'desc' ? (
        <ArrowDownIcon className="size-3.5" />
      ) : (
        <ChevronsUpDownIcon className="size-3.5 opacity-50" />
      )}
    </Button>
  );
}

function calculatePowerAtCurrent(
  current: Measurement,
  motor: Motor,
): Measurement {
  const tApplied = Measurement.min(
    current.mul(motor.kT),
    motor.stallTorque.div(2),
  );

  const wApplied = motor.freeSpeed.mul(
    new Measurement(1).sub(tApplied.div(motor.stallTorque)),
  );

  return tApplied.mul(wApplied).removeRad();
}

export default function MotorTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [currentDraw, setCurrentDraw] = useState(new Measurement(60, 'A'));

  const data = useMemo(
    () =>
      ALL_MOTORS.map((specs) => ({
        motor: Motor.fromSpecs(specs, 1),
        motorSpecs: completeMotorSpecs(specs),
      })),
    [],
  );

  const columns: ColumnDef<typeof features, MotorRow>[] = useMemo(
    () => [
      {
        accessorFn: (row) => row.motor.identifier,
        id: 'name',
        header: ({ column }) => (
          <SortableHeader column={column} align="left">
            Motor
          </SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            <span>{row.original.motor.identifier}</span>
            {row.original.motorSpecs.vendors
              .toSorted((a, b) => a.localeCompare(b))
              .map((vendor) => (
                <VendorBadge key={vendor} vendor={vendor} />
              ))}
          </div>
        ),
      },
      {
        accessorFn: (row) => row.motorSpecs.freeSpeed.to('rpm').scalar,
        id: 'freeSpeed',
        header: ({ column }) => (
          <SortableHeader column={column}>Free Speed</SortableHeader>
        ),
        cell: ({ row }) => {
          const speed = row.original.motorSpecs.freeSpeed;
          return (
            <div className="text-right text-sm tabular-nums">
              {speed.to('rpm').scalar.toLocaleString()}{' '}
              <span className="text-muted-foreground">
                {speed.to('rpm').units()}
              </span>
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.motorSpecs.stallTorque.to('N m').scalar,
        id: 'stallTorque',
        header: ({ column }) => (
          <SortableHeader column={column}>Stall Torque</SortableHeader>
        ),
        cell: ({ row }) => {
          const torque = row.original.motorSpecs.stallTorque;
          return (
            <div className="text-right text-sm tabular-nums">
              {torque.to('N m').scalar.toFixed(2)}{' '}
              <span className="text-muted-foreground">
                {torque.to('N m').units()}
              </span>
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.motorSpecs.stallCurrent.to('A').scalar,
        id: 'stallCurrent',
        header: ({ column }) => (
          <SortableHeader column={column}>Stall Current</SortableHeader>
        ),
        cell: ({ row }) => {
          const current = row.original.motorSpecs.stallCurrent;
          return (
            <div className="text-right text-sm tabular-nums">
              {current.to('A').scalar.toFixed(0)}{' '}
              <span className="text-muted-foreground">
                {current.to('A').units()}
              </span>
            </div>
          );
        },
      },
      {
        accessorFn: (row) =>
          calculatePowerAtCurrent(
            Measurement.min(row.motor.stallCurrent, currentDraw),
            row.motor,
          ).to('W').scalar,
        id: 'peakPower',
        header: ({ column }) => (
          <SortableHeader column={column}>Peak Power</SortableHeader>
        ),
        cell: ({ row }) => {
          return (
            <div className="text-right text-sm tabular-nums">
              {calculatePowerAtCurrent(
                Measurement.min(row.original.motor.stallCurrent, currentDraw),
                row.original.motor,
              )
                .to('W')
                .scalar.toFixed(0)}{' '}
              W
            </div>
          );
        },
      },
      {
        accessorFn: (row) =>
          calculatePowerAtCurrent(
            Measurement.min(row.motor.stallCurrent, currentDraw),
            row.motor,
          )
            .div(
              row.motorSpecs.motorWeight.add(row.motorSpecs.controllerWeight),
            )
            .to('W/lb').scalar,
        id: 'powerDensity',
        header: ({ column }) => (
          <SortableHeader column={column}>Power Density</SortableHeader>
        ),
        cell: ({ row }) => {
          return (
            <div className="text-right text-sm tabular-nums">
              {calculatePowerAtCurrent(
                Measurement.min(row.original.motor.stallCurrent, currentDraw),
                row.original.motor,
              )
                .div(
                  row.original.motorSpecs.motorWeight.add(
                    row.original.motorSpecs.controllerWeight,
                  ),
                )
                .to('W/lb')
                .scalar.toFixed(0)}{' '}
              W/lb
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.motorSpecs.freeCurrent.to('A').scalar,
        id: 'freeCurrent',
        header: ({ column }) => (
          <SortableHeader column={column}>Free Current</SortableHeader>
        ),
        cell: ({ row }) => {
          const current = row.original.motorSpecs.freeCurrent;
          return (
            <div className="text-right text-sm tabular-nums">
              {current.to('A').scalar.toFixed(1)}{' '}
              <span className="text-muted-foreground">
                {current.to('A').units()}
              </span>
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.motorSpecs.motorWeight.to('lb').scalar,
        id: 'motorWeight',
        header: ({ column }) => (
          <SortableHeader column={column} align="center">
            Weight
          </SortableHeader>
        ),
        cell: ({ row }) => {
          return (
            <div className="text-right text-sm tabular-nums">
              {row.original.motorSpecs.motorWeight.to('lb').scalar.toFixed(2)}{' '}
              <span className="text-muted-foreground">lb</span>
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.motor.kT.to('N m/A').scalar,
        id: 'kT',
        header: ({ column }) => (
          <SortableHeader column={column} align="center">
            kT (Nm/A)
          </SortableHeader>
        ),
        cell: ({ row }) => {
          return (
            <div className="text-right text-sm tabular-nums">
              {row.original.motor.kT.to('N m/A').scalar.toFixed(4)}
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.motorSpecs.dataSource,
        id: 'dataSource',
        header: ({ column }) => (
          <SortableHeader column={column} align="center">
            Data From
          </SortableHeader>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex justify-center">
              <VendorBadge vendor={row.original.motorSpecs.dataSource} />
            </div>
          );
        },
      },
    ],
    [currentDraw],
  );

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="w-full space-y-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Motor Comparison
      </h2>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex flex-col gap-1 border-b bg-muted/20 p-4">
          <div className="max-w-60">
            <MeasurementInput
              stateHook={[currentDraw, setCurrentDraw]}
              label="Current Draw"
              tooltip="The current used to compute the Peak Power and Power Density columns in the table below."
              testId="currentDraw"
              labelAbove
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Sets the current at which the Peak Power and Power Density columns
            below are calculated.
          </p>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No motors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
