import { useCallback, useMemo, useState } from 'react';
import CheckIcon from '~icons/lucide/check';

import { BeltTable } from '~/components/recalc/beltTable';
import CalcHeading from '~/components/recalc/calcHeading';
import BooleanInput from '~/components/recalc/io/boolean';
import {
  MeasurementDisplayOutput,
  MeasurementInput,
} from '~/components/recalc/io/measurement';
import NumberInput, {
  NumberDisplayOutput,
} from '~/components/recalc/io/number';
import { PulleyTable } from '~/components/recalc/pulleyTable';
import { Button } from '~/components/ui/button';
import { ButtonGroup } from '~/components/ui/button-group';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import { calculateClosestCenters } from '~/lib/math/belts';
import { Belt } from '~/lib/models/Belt';
import Measurement from '~/lib/models/Measurement';
import Pulley, { SimplePulley } from '~/lib/models/Pulley';
import { buildMeta, pageUrl } from '~/lib/seo';
import {
  BooleanParam,
  MeasurementParam,
  NumberParam,
} from '~/lib/types/queryParams';
import { cn } from '~/lib/utils';

const BELT_PATH = '/belts';
const BELT_TITLE = 'FRC & FTC Belt Calculator | ReCalc';
const BELT_NAME = 'Belt Calculator';
const BELT_DESCRIPTION =
  'Calculate optimal belt drive configurations for FRC and FTC robots. Find center-to-center distances, belt lengths, and compatible pulley combinations.';

export function meta() {
  return [
    ...buildMeta({
      path: BELT_PATH,
      title: BELT_TITLE,
      description: BELT_DESCRIPTION,
    }),
    {
      'script:ld+json': buildJsonLd(
        buildWebPage({
          url: pageUrl(BELT_PATH),
          name: BELT_NAME,
          description: BELT_DESCRIPTION,
          breadcrumbLabel: BELT_NAME,
        }),
        buildCalculatorApp({
          url: pageUrl(BELT_PATH),
          name: BELT_NAME,
          description: BELT_DESCRIPTION,
        }),
      ),
    },
  ];
}

const DEFAULT_PARAMS = {
  customBeltTeeth: NumberParam.withDefault(125),
  desiredCenter: MeasurementParam.withDefault(new Measurement(5, 'in')),
  extraCenter: MeasurementParam.withDefault(new Measurement(0, 'mm')),
  p1Teeth: NumberParam.withDefault(16),
  p2Teeth: NumberParam.withDefault(24),
  pitch: MeasurementParam.withDefault(new Measurement(5, 'mm')),
  toothIncrement: NumberParam.withDefault(5),
  useCustomBelt: BooleanParam.withDefault(false),
};

function SuggestedBadge() {
  return (
    <span className="flex items-center gap-1 rounded border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
      <CheckIcon className="size-3" />
      Suggested
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export default function Belts() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [customBeltTeeth, setCustomBeltTeeth] = useState(
    queryParams.customBeltTeeth,
  );
  const [desiredCenter, setDesiredCenter] = useState(queryParams.desiredCenter);
  const [extraCenter, setExtraCenter] = useState(queryParams.extraCenter);
  const [p1Teeth, setP1Teeth] = useState(queryParams.p1Teeth);
  const [p2Teeth, setP2Teeth] = useState(queryParams.p2Teeth);
  const [pitch, setPitch] = useState(queryParams.pitch);
  const [toothIncrement, setToothIncrement] = useState(
    queryParams.toothIncrement,
  );
  const [useCustomBelt, setUseCustomBelt] = useState(queryParams.useCustomBelt);

  const activeBeltType = useMemo(() => {
    if (pitch.eq(new Measurement(3, 'mm')) && toothIncrement === 5)
      return 'gt2';
    if (pitch.eq(new Measurement(5, 'mm')) && toothIncrement === 5)
      return 'htd';
    if (pitch.eq(new Measurement(0.25, 'in')) && toothIncrement === 8)
      return 'rt25';
    return null;
  }, [pitch, toothIncrement]);

  const results = useMemo(
    () =>
      calculateClosestCenters(
        new SimplePulley(p1Teeth, pitch),
        new SimplePulley(p2Teeth, pitch),
        desiredCenter,
        toothIncrement,
      ),
    [p1Teeth, p2Teeth, pitch, desiredCenter, toothIncrement],
  );

  const p1PitchDiameter = useMemo(
    () => new SimplePulley(p1Teeth, pitch).pitchDiameter,
    [p1Teeth, pitch],
  );

  const p2PitchDiameter = useMemo(
    () => new SimplePulley(p2Teeth, pitch).pitchDiameter,
    [p2Teeth, pitch],
  );

  const isSmallerBeltSuggested = useMemo(
    () =>
      results.smaller.differenceFromTarget
        .abs()
        .lte(results.larger.differenceFromTarget.abs()),
    [results.smaller.differenceFromTarget, results.larger.differenceFromTarget],
  );

  const pulleyFilter = useCallback(
    (pulley: Pulley) =>
      pulley.pitch.eq(pitch) &&
      (pulley.teeth === p1Teeth || pulley.teeth === p2Teeth),
    [pitch, p1Teeth, p2Teeth],
  );

  const beltFilter = useCallback(
    (belt: Belt) =>
      belt.pitch.eq(pitch) &&
      (belt.teeth === results.larger.belt.teeth ||
        belt.teeth === results.smaller.belt.teeth),
    [pitch, results.larger.belt.teeth, results.smaller.belt.teeth],
  );

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    pitch,
    toothIncrement,
    desiredCenter,
    extraCenter,
    useCustomBelt,
    customBeltTeeth,
    p1Teeth,
    p2Teeth,
  });

  return (
    <div>
      <CalcHeading
        title="Belt Calculator"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-col gap-6 px-1 lg:flex-row">
        {/* Left column: configuration + results */}
        <div className="flex min-w-0 flex-1 flex-col gap-y-4">
          {/* Parameters */}
          <div className="rounded-xl border bg-muted/20 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>Parameters</SectionLabel>
              <BooleanInput
                stateHook={[useCustomBelt, setUseCustomBelt]}
                label="Use Custom Belt"
                testId="enableCustomBelt"
              />
            </div>
            <div className="flex flex-col gap-y-3">
              <div className="flex flex-wrap gap-y-2">
                <ButtonGroup>
                  <Button
                    variant={activeBeltType === 'gt2' ? 'default' : 'outline'}
                    onClick={() => {
                      setPitch(new Measurement(3, 'mm'));
                      setToothIncrement(5);
                    }}
                  >
                    GT2 (3mm)
                  </Button>
                  <Button
                    variant={activeBeltType === 'htd' ? 'default' : 'outline'}
                    onClick={() => {
                      setPitch(new Measurement(5, 'mm'));
                      setToothIncrement(5);
                    }}
                  >
                    HTD (5mm)
                  </Button>
                  <Button
                    variant={activeBeltType === 'rt25' ? 'default' : 'outline'}
                    onClick={() => {
                      setPitch(new Measurement(0.25, 'in'));
                      setToothIncrement(8);
                    }}
                  >
                    RT25 (0.25in)
                  </Button>
                </ButtonGroup>
              </div>
              <div className="flex flex-col gap-3 *:flex-1 md:flex-row md:gap-x-4">
                <MeasurementInput
                  stateHook={[pitch, setPitch]}
                  label="Pitch"
                  testId="pitch"
                  labelAbove
                />
                <NumberInput
                  stateHook={[toothIncrement, setToothIncrement]}
                  label="Tooth Increment"
                  testId="beltToothIncrement"
                  labelAbove
                />
              </div>
              {useCustomBelt ? (
                <div className="flex flex-col gap-3 *:flex-1 md:flex-row md:gap-x-4">
                  <NumberInput
                    stateHook={[customBeltTeeth, setCustomBeltTeeth]}
                    label="Custom Belt Teeth"
                    testId="specificBeltTeeth"
                    labelAbove
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3 *:flex-1 md:flex-row md:gap-x-4">
                  <MeasurementInput
                    stateHook={[desiredCenter, setDesiredCenter]}
                    label="Target Center"
                    testId="desiredCenter"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[extraCenter, setExtraCenter]}
                    label="Extra Center"
                    testId="extraCenter"
                    labelAbove
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pulley cards */}
          <div className="flex flex-col gap-3 md:flex-row">
            <Card className="flex-1 gap-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="border-l-2 border-primary/50 pl-3">
                  Pulley 1
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2 pt-2">
                <NumberInput
                  stateHook={[p1Teeth, setP1Teeth]}
                  label="Teeth"
                  testId="p1Teeth"
                  labelAbove
                />
                <MeasurementDisplayOutput
                  state={p1PitchDiameter}
                  label="Pitch Diameter"
                  defaultUnit="in"
                  testId="p1PitchDiameter"
                />
              </CardContent>
            </Card>

            <Card className="flex-1 gap-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="border-l-2 border-primary/50 pl-3">
                  Pulley 2
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2 pt-2">
                <NumberInput
                  stateHook={[p2Teeth, setP2Teeth]}
                  label="Teeth"
                  testId="p2Teeth"
                  labelAbove
                />
                <MeasurementDisplayOutput
                  state={p2PitchDiameter}
                  label="Pitch Diameter"
                  defaultUnit="in"
                  testId="p2PitchDiameter"
                />
              </CardContent>
            </Card>
          </div>

          {/* Result cards */}
          <BeltResultCard
            title="Smaller Belt"
            isSuggested={isSmallerBeltSuggested}
            beltTeeth={results.smaller.belt.teeth}
            centerDistance={results.smaller.distance}
            p1TeethInMesh={results.smaller.p1TeethInMesh}
            p2TeethInMesh={results.smaller.p2TeethInMesh}
            gapBetweenPulleys={results.smaller.gapBetweenPulleys}
            differenceFromTarget={results.smaller.differenceFromTarget}
            testPrefix="smaller"
          />

          <BeltResultCard
            title="Larger Belt"
            isSuggested={!isSmallerBeltSuggested}
            beltTeeth={results.larger.belt.teeth}
            centerDistance={results.larger.distance}
            p1TeethInMesh={results.larger.p1TeethInMesh}
            p2TeethInMesh={results.larger.p2TeethInMesh}
            gapBetweenPulleys={results.larger.gapBetweenPulleys}
            differenceFromTarget={results.larger.differenceFromTarget}
            testPrefix="larger"
          />
        </div>

        {/* Right column: COTS tables */}
        <div className="flex min-w-0 flex-1 flex-col gap-y-4">
          <PulleyTable filterFn={pulleyFilter} />
          <BeltTable filterFn={beltFilter} />
        </div>
      </div>
    </div>
  );
}

function BeltResultCard({
  title,
  isSuggested,
  beltTeeth,
  centerDistance,
  p1TeethInMesh,
  p2TeethInMesh,
  gapBetweenPulleys,
  differenceFromTarget,
  testPrefix,
}: {
  title: string;
  isSuggested: boolean;
  beltTeeth: number;
  centerDistance: Measurement;
  p1TeethInMesh: number;
  p2TeethInMesh: number;
  gapBetweenPulleys: Measurement;
  differenceFromTarget: Measurement;
  testPrefix: string;
}) {
  return (
    <Card
      className={cn(
        'gap-2 shadow-sm transition-colors',
        isSuggested && 'border-primary/40 ring-1 ring-primary/20',
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex min-h-7 items-center gap-2">
          {title}
          {isSuggested && <SuggestedBadge />}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <NumberDisplayOutput
          state={beltTeeth}
          label="Belt Teeth"
          roundTo={0}
          testId={`${testPrefix}BeltTeeth`}
        />
        <MeasurementDisplayOutput
          state={centerDistance}
          label="Center Distance"
          defaultUnit="in"
          testId={`${testPrefix}Center`}
        />
        <NumberDisplayOutput
          state={p1TeethInMesh}
          label="P1 Teeth in Mesh"
          roundTo={0}
          testId={`${testPrefix}P1TeethInMesh`}
        />
        <NumberDisplayOutput
          state={p2TeethInMesh}
          label="P2 Teeth in Mesh"
          roundTo={0}
          testId={`${testPrefix}P2TeethInMesh`}
        />
        <MeasurementDisplayOutput
          state={gapBetweenPulleys}
          label="Gap Between Pulleys"
          defaultUnit="in"
          testId={`${testPrefix}PulleyGap`}
        />
        <MeasurementDisplayOutput
          state={differenceFromTarget}
          label="Diff From Target"
          defaultUnit="in"
          testId={`${testPrefix}DiffFromTarget`}
        />
      </CardContent>
    </Card>
  );
}
