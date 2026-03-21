import { Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import CalcHeading from '~/components/recalc/calcHeading';
import NumberInput from '~/components/recalc/io/number';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { calculateInverseRatio, calculateNetRatio } from '~/lib/math/ratio';
import { ALL_MOTORS } from '~/lib/models/Motor';
import { type RatioPair, RatioPairListParam } from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Ratio Calculator' },
    { name: 'description', content: 'Ratio Calculator' },
  ];
}

interface RatioPairWithId {
  id: string;
  pair: RatioPair;
}

const DEFAULT_PARAMS = {
  ratioPairs: RatioPairListParam.withDefault([
    [18, 72],
    [24, 48],
  ] as RatioPair[]),
};

export default function Ratio() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const idCounter = useRef(0);
  const [ratioPairsWithIds, setRatioPairsWithIds] = useState<RatioPairWithId[]>(
    () =>
      queryParams.ratioPairs.map((pair) => ({
        id: `pair-${idCounter.current++}`,
        pair,
      })),
  );

  const ratioPairs = useMemo(
    () => ratioPairsWithIds.map((item) => item.pair),
    [ratioPairsWithIds],
  );

  const netRatio = useMemo(() => calculateNetRatio(ratioPairs), [ratioPairs]);

  const invNetRatio = useMemo(
    () => calculateInverseRatio(netRatio),
    [netRatio],
  );

  const updatePair = useCallback(
    (id: string, driving: number, driven: number) => {
      setRatioPairsWithIds((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, pair: [driving, driven] } : item,
        ),
      );
    },
    [],
  );

  const addStage = useCallback(() => {
    setRatioPairsWithIds((prev) => [
      ...prev,
      { id: `pair-${idCounter.current++}`, pair: [1, 1] },
    ]);
  }, []);

  const removeStage = useCallback((id: string) => {
    setRatioPairsWithIds((prev) => {
      if (prev.length > 1) {
        return prev.filter((item) => item.id !== id);
      }
      return prev;
    });
  }, []);

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    ratioPairs,
  });

  return (
    <div>
      <CalcHeading
        title="Ratio Calculator"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-col gap-4 px-1 *:flex-1 md:flex-row md:gap-x-4">
        <div className="flex flex-col gap-x-4 gap-y-2">
          <div className="mb-2 grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 font-semibold">
            <Label>Stage</Label>
            <Label>Driving</Label>
            <Label>Driven</Label>
            <div className="w-9" />
          </div>

          {ratioPairsWithIds.map((item, index) => (
            <RatioPairRow
              key={item.id}
              id={item.id}
              index={index}
              driving={item.pair[0]}
              driven={item.pair[1]}
              onUpdate={updatePair}
              onRemove={removeStage}
              canRemove={ratioPairsWithIds.length > 1}
              drivingTestId={`driving${index}`}
              drivenTestId={`driven${index}`}
              removeTestId={`removeStage${index}`}
            />
          ))}

          <div className="mt-2">
            <Button onClick={addStage} data-testid="addStage">
              Add Stage
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-x-4 gap-y-2">
          <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="text-sm font-medium text-muted-foreground">
              Net {netRatio < 1 ? 'Reduction' : 'Step-Up'}
            </div>
            <div
              className="mt-2 font-mono text-3xl font-bold tabular-nums"
              data-testid="netRatio"
            >
              {netRatio < 1
                ? `${invNetRatio.toFixed(3)}:1`
                : `1:${netRatio.toFixed(3)}`}
            </div>
          </div>

          <div className="mt-4">
            <Label className="mb-2 block text-sm font-semibold">
              Motor Speeds at {netRatio.toFixed(3)}:1
            </Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {ALL_MOTORS.toSorted((a, b) => a.name.localeCompare(b.name)).map(
                (motor) => (
                  <div key={motor.name} className="flex justify-between gap-2">
                    <span className="truncate text-muted-foreground">
                      {motor.name}
                    </span>
                    <span className="font-mono tabular-nums">
                      {Math.round(
                        motor.freeSpeed.mul(netRatio).to('rpm').scalar,
                      )}{' '}
                      rpm
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RatioPairRowProps {
  id: string;
  index: number;
  driving: number;
  driven: number;
  onUpdate: (id: string, driving: number, driven: number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
  drivingTestId: string;
  drivenTestId: string;
  removeTestId: string;
}

function RatioPairRow({
  id,
  index,
  driving,
  driven,
  onUpdate,
  onRemove,
  canRemove,
  drivingTestId,
  drivenTestId,
  removeTestId,
}: RatioPairRowProps) {
  const [drivingValue, setDrivingValue] = useState(driving);
  const [drivenValue, setDrivenValue] = useState(driven);

  useEffect(() => {
    setDrivingValue(driving);
  }, [driving]);

  useEffect(() => {
    setDrivenValue(driven);
  }, [driven]);

  useEffect(() => {
    onUpdate(id, drivingValue, drivenValue);
  }, [drivingValue, drivenValue, id, onUpdate]);

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
      <Label className="text-sm">Stage {index}</Label>
      <div>
        <NumberInput
          stateHook={[drivingValue, setDrivingValue]}
          label=""
          testId={drivingTestId}
        />
      </div>
      <div>
        <NumberInput
          stateHook={[drivenValue, setDrivenValue]}
          label=""
          testId={drivenTestId}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(id)}
        disabled={!canRemove}
        className="h-9 w-9"
        data-testid={removeTestId}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
