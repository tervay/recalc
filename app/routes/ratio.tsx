import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import Plus from '~icons/lucide/plus';
import Trash2 from '~icons/lucide/trash-2';

import CalcHeading from '~/components/recalc/calcHeading';
import NumberInput from '~/components/recalc/io/number';
import { Button } from '~/components/ui/button';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import { calculateInverseRatio, calculateNetRatio } from '~/lib/math/ratio';
import { ALL_MOTORS } from '~/lib/models/Motor';
import { buildMeta, pageUrl } from '~/lib/seo';
import { type RatioPair, RatioPairListParam } from '~/lib/types/queryParams';

const RATIO_PATH = '/ratio';
const RATIO_TITLE = 'FRC & FTC Gear Ratio Calculator | ReCalc';
const RATIO_NAME = 'Ratio Calculator';
const RATIO_DESCRIPTION =
  'Calculate gear, belt, and chain drive ratios for FRC and FTC robot mechanisms. Chain multi-stage reduction calculations.';

export function meta() {
  return [
    ...buildMeta({
      path: RATIO_PATH,
      title: RATIO_TITLE,
      description: RATIO_DESCRIPTION,
    }),
    {
      'script:ld+json': buildJsonLd(
        buildWebPage({
          url: pageUrl(RATIO_PATH),
          name: RATIO_NAME,
          description: RATIO_DESCRIPTION,
          breadcrumbLabel: RATIO_NAME,
        }),
        buildCalculatorApp({
          url: pageUrl(RATIO_PATH),
          name: RATIO_NAME,
          description: RATIO_DESCRIPTION,
        }),
      ),
    },
  ];
}

interface RatioPairWithId {
  id: string;
  pair: RatioPair;
}

let ratioPairIdCounter = 0;
const nextRatioPairId = () => `pair-${ratioPairIdCounter++}`;

const DEFAULT_PARAMS = {
  ratioPairs: RatioPairListParam.withDefault([
    [18, 72],
    [24, 48],
  ] as RatioPair[]),
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export default function Ratio() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [ratioPairsWithIds, setRatioPairsWithIds] = useState<RatioPairWithId[]>(
    () =>
      queryParams.ratioPairs.map((pair) => ({
        id: nextRatioPairId(),
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
      { id: nextRatioPairId(), pair: [1, 1] },
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

  const isReduction = netRatio < 1;
  const netRatioLabel = isReduction
    ? `${invNetRatio.toFixed(3)}:1`
    : `1:${netRatio.toFixed(3)}`;
  const netRatioAlt = isReduction
    ? `1:${netRatio.toFixed(3)}`
    : `${invNetRatio.toFixed(3)}:1`;

  const chainLabel = ratioPairs.map((p) => `${p[0]}:${p[1]}`).join(' × ');

  const motorRatioLabel = isReduction
    ? `${invNetRatio.toFixed(2)}:1`
    : `1:${netRatio.toFixed(2)}`;

  return (
    <div>
      <CalcHeading
        title="Ratio Calculator"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-col gap-4 px-1 *:flex-1 md:flex-row md:gap-x-4">
        {/* Left column: stage inputs */}
        <div className="rounded-xl border bg-muted/20 p-4 shadow-sm">
          <div className="mb-3">
            <SectionLabel>Stages</SectionLabel>
          </div>

          {/* Column headers */}
          <div className="mb-1 grid grid-cols-[auto_1fr_1fr_5rem_2.25rem] items-center gap-2 px-1">
            <span className="text-xs text-muted-foreground">Stage</span>
            <span className="text-xs text-muted-foreground">Driving</span>
            <span className="text-xs text-muted-foreground">Driven</span>
            <span className="text-right text-xs text-muted-foreground">
              Ratio
            </span>
            <div />
          </div>

          <div className="flex flex-col divide-y">
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
          </div>

          <div className="mt-3 border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={addStage}
              data-testid="addStage"
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Stage
            </Button>
          </div>
        </div>

        {/* Right column: results */}
        <div className="flex flex-col gap-4">
          {/* Net ratio hero card */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3">
              <SectionLabel>Result</SectionLabel>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="font-mono text-4xl font-bold tabular-nums"
                  data-testid="netRatio"
                >
                  {netRatioLabel}
                </div>
                <div className="mt-1 font-mono text-sm text-muted-foreground tabular-nums">
                  {netRatioAlt}
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {isReduction ? 'Reduction' : 'Step-Up'}
              </span>
            </div>
            <div className="mt-4 border-t pt-3">
              <p className="font-mono text-xs text-muted-foreground tabular-nums">
                {chainLabel} = {netRatioLabel}
              </p>
            </div>
          </div>

          {/* Motor speeds card */}
          <div className="rounded-xl border bg-muted/20 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-4">
              <SectionLabel>Motor Speeds</SectionLabel>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                at {motorRatioLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
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
  const setDrivingValue: Dispatch<SetStateAction<number>> = (value) =>
    onUpdate(id, typeof value === 'function' ? value(driving) : value, driven);
  const setDrivenValue: Dispatch<SetStateAction<number>> = (value) =>
    onUpdate(id, driving, typeof value === 'function' ? value(driven) : value);

  const stageRatio = driving > 0 ? driven / driving : 0;
  const inv = stageRatio > 0 ? 1 / stageRatio : 0;
  const stageRatioLabel =
    stageRatio === 0
      ? '—'
      : stageRatio < 1
        ? `${inv.toFixed(2)}:1`
        : `1:${stageRatio.toFixed(2)}`;

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_5rem_2.25rem] items-center gap-2 py-2">
      <span className="text-sm text-muted-foreground">{index + 1}</span>
      <div>
        <NumberInput
          stateHook={[driving, setDrivingValue]}
          label=""
          testId={drivingTestId}
        />
      </div>
      <div>
        <NumberInput
          stateHook={[driven, setDrivenValue]}
          label=""
          testId={drivenTestId}
        />
      </div>
      <span className="text-right font-mono text-xs text-muted-foreground tabular-nums">
        {stageRatioLabel}
      </span>
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
