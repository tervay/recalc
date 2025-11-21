import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import IOLine from '~/components/recalc/blocks';
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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [currentDraw, setCurrentDraw] = useState(new Measurement(60, 'A'));

  const data = useMemo(
    () =>
      ALL_MOTORS.map((specs) => ({
        motor: Motor.fromSpecs(specs, 1),
        motorSpecs: completeMotorSpecs(specs),
      })),
    [],
  );

  const columns: ColumnDef<{
    motor: Motor;
    motorSpecs: FullMotorSpecs;
  }>[] = useMemo(
    () => [
      {
        accessorFn: (row) => row.motor.identifier,
        id: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="p-0 hover:bg-transparent"
            >
              Motor
            </Button>
          );
        },
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="ml-auto flex p-0 hover:bg-transparent"
            >
              Free Speed
            </Button>
          );
        },
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="ml-auto flex p-0 hover:bg-transparent"
            >
              Stall Torque
            </Button>
          );
        },
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="ml-auto flex p-0 hover:bg-transparent"
            >
              Stall Current
            </Button>
          );
        },
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="ml-auto flex p-0 hover:bg-transparent"
            >
              Peak powerDensity
            </Button>
          );
        },
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="ml-auto flex p-0 hover:bg-transparent"
            >
              Power Density
            </Button>
          );
        },
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="ml-auto flex p-0 hover:bg-transparent"
            >
              Free Current
            </Button>
          );
        },
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="mx-auto flex p-0 hover:bg-transparent"
            >
              Weight
            </Button>
          );
        },
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="mx-auto flex p-0 hover:bg-transparent"
            >
              kT (Nm/A)
            </Button>
          );
        },
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
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="mx-auto flex p-0 hover:bg-transparent"
            >
              Data From
            </Button>
          );
        },
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <IOLine>
        <MeasurementInput
          stateHook={[currentDraw, setCurrentDraw]}
          label="Current Draw"
        />
      </IOLine>
      <div className="w-full space-y-4">
        <div className="rounded-lg border border-border">
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
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
    </div>
  );
}
