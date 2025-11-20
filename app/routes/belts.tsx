import { CheckIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { BeltTable } from '~/components/recalc/beltTable';
import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import BooleanInput from '~/components/recalc/io/boolean';
import {
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import NumberInput, { NumberOutput } from '~/components/recalc/io/number';
import { PulleyTable } from '~/components/recalc/pulleyTable';
import { Button } from '~/components/ui/button';
import { ButtonGroup } from '~/components/ui/button-group';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { calculateClosestCenters } from '~/lib/math/belts';
import Measurement from '~/lib/models/Measurement';
import { SimplePulley } from '~/lib/models/Pulley';
import {
  BooleanParam,
  MeasurementParam,
  NumberParam,
  withDefault,
} from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Belt Calculator' },
    { name: 'description', content: 'Belt Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  customBeltTeeth: withDefault(NumberParam, 125),
  desiredCenter: withDefault(MeasurementParam, new Measurement(5, 'in')),
  extraCenter: withDefault(MeasurementParam, new Measurement(0, 'mm')),
  p1Teeth: withDefault(NumberParam, 16),
  p2Teeth: withDefault(NumberParam, 24),
  pitch: withDefault(MeasurementParam, new Measurement(5, 'mm')),
  toothIncrement: withDefault(NumberParam, 5),
  useCustomBelt: withDefault(BooleanParam, false),
};

export default function Belts() {
  const queryParams = useQueryParams<{
    customBeltTeeth: number;
    desiredCenter: Measurement;
    extraCenter: Measurement;
    p1Teeth: number;
    p2Teeth: number;
    pitch: Measurement;
    toothIncrement: number;
    useCustomBelt: boolean;
  }>(DEFAULT_PARAMS);

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

  function SuggestedBadge() {
    return (
      <span
        className="flex items-center gap-1 rounded border border-green-500/20
          bg-green-500/10 px-1.5 py-0.5 text-xs text-green-700
          dark:text-green-400"
      >
        <CheckIcon className="size-3" />
        Suggested
      </span>
    );
  }

  return (
    <div>
      <CalcHeading
        title="Belt Calculator"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-row flex-wrap gap-x-4 px-1 *:flex-1">
        <div className="flex flex-col gap-x-4 gap-y-2">
          <div
            className="flex flex-wrap items-center justify-between gap-2 px-1"
          >
            <ButtonGroup>
              <Button
                variant="outline"
                onClick={() => {
                  setPitch(new Measurement(3, 'mm'));
                  setToothIncrement(5);
                }}
              >
                GT2 (3mm)
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPitch(new Measurement(5, 'mm'));
                  setToothIncrement(5);
                }}
              >
                HTD (5mm)
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPitch(new Measurement(0.25, 'in'));
                  setToothIncrement(8);
                }}
              >
                RT25 (0.25in)
              </Button>
            </ButtonGroup>
            <BooleanInput
              stateHook={[useCustomBelt, setUseCustomBelt]}
              label="Use Custom Belt"
              testId="enableCustomBelt"
            />
          </div>
          <IOLine>
            <MeasurementInput
              stateHook={[pitch, setPitch]}
              label="Pitch"
              testId="pitch"
            />
            <NumberInput
              stateHook={[toothIncrement, setToothIncrement]}
              label="Tooth Increment"
              testId="beltToothIncrement"
            />
          </IOLine>
          {!useCustomBelt && (
            <IOLine>
              <MeasurementInput
                stateHook={[desiredCenter, setDesiredCenter]}
                label="Target Center"
                testId="desiredCenter"
              />
              <MeasurementInput
                stateHook={[extraCenter, setExtraCenter]}
                label="Extra Center"
                testId="extraCenter"
              />
            </IOLine>
          )}

          {useCustomBelt && (
            <IOLine>
              <NumberInput
                stateHook={[customBeltTeeth, setCustomBeltTeeth]}
                label="Custom Belt Teeth"
                testId="specificBeltTeeth"
              />
            </IOLine>
          )}

          <div className="flex flex-col gap-2 md:flex-row">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Pulley 1</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2">
                <IOLine>
                  <NumberInput
                    stateHook={[p1Teeth, setP1Teeth]}
                    label="Teeth"
                    testId="p1Teeth"
                  />
                </IOLine>
                <IOLine>
                  <MeasurementOutput
                    state={p1PitchDiameter}
                    label="Pitch Diameter"
                    defaultUnit="in"
                    testId="p1PitchDiameter"
                  />
                </IOLine>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Pulley 2</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2">
                <IOLine>
                  <NumberInput
                    stateHook={[p2Teeth, setP2Teeth]}
                    label="Teeth"
                    testId="p2Teeth"
                  />
                </IOLine>
                <IOLine>
                  <MeasurementOutput
                    state={p2PitchDiameter}
                    label="Pitch Diameter"
                    defaultUnit="in"
                    testId="p2PitchDiameter"
                  />
                </IOLine>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex min-h-7 items-center gap-2">
                Smaller Belt
                {isSmallerBeltSuggested && <SuggestedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-2">
              <IOLine>
                <NumberOutput
                  state={results.smaller.belt.teeth}
                  label="Belt Teeth"
                  roundTo={0}
                  testId="smallerBeltTeeth"
                />
                <MeasurementOutput
                  state={results.smaller.distance}
                  label="Center Distance"
                  defaultUnit="in"
                  testId="smallerCenter"
                />
              </IOLine>

              <IOLine>
                <NumberOutput
                  state={results.smaller.p1TeethInMesh}
                  label="Pulley 1 Teeth in Mesh"
                  roundTo={0}
                  testId="smallerP1TeethInMesh"
                />
                <NumberOutput
                  state={results.smaller.p2TeethInMesh}
                  label="Pulley 2 Teeth in Mesh"
                  roundTo={0}
                  testId="smallerP2TeethInMesh"
                />
              </IOLine>

              <IOLine>
                <MeasurementOutput
                  state={results.smaller.gapBetweenPulleys}
                  label="Gap Between Pulleys"
                  defaultUnit="in"
                  testId="smallerPulleyGap"
                />
                <MeasurementOutput
                  state={results.smaller.differenceFromTarget}
                  label="Difference From Target"
                  defaultUnit="in"
                  testId="smallerDiffFromTarget"
                />
              </IOLine>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex min-h-7 items-center gap-2">
                Larger Belt
                {!isSmallerBeltSuggested && <SuggestedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-2">
              <IOLine>
                <NumberOutput
                  state={results.larger.belt.teeth}
                  label="Belt Teeth"
                  roundTo={0}
                  testId="largerBeltTeeth"
                />
                <MeasurementOutput
                  state={results.larger.distance}
                  label="Center Distance"
                  defaultUnit="in"
                  testId="largerCenter"
                />
              </IOLine>

              <IOLine>
                <NumberOutput
                  state={results.larger.p1TeethInMesh}
                  label="Pulley 1 Teeth in Mesh"
                  roundTo={0}
                  testId="largerP1TeethInMesh"
                />
                <NumberOutput
                  state={results.larger.p2TeethInMesh}
                  label="Pulley 2 Teeth in Mesh"
                  roundTo={0}
                  testId="largerP2TeethInMesh"
                />
              </IOLine>

              <IOLine>
                <MeasurementOutput
                  state={results.larger.gapBetweenPulleys}
                  label="Gap Between Pulleys"
                  defaultUnit="in"
                  testId="largerPulleyGap"
                />
                <MeasurementOutput
                  state={results.larger.differenceFromTarget}
                  label="Difference From Target"
                  defaultUnit="in"
                  testId="largerDiffFromTarget"
                />
              </IOLine>
            </CardContent>
          </Card>
        </div>
        <div className="flex w-auto flex-col gap-x-4 gap-y-4">
          <PulleyTable
            filterFn={(pulley) =>
              pulley.pitch.eq(pitch) &&
              (pulley.teeth == p1Teeth || pulley.teeth == p2Teeth)
            }
          />
          <BeltTable
            filterFn={(belt) =>
              belt.pitch.eq(pitch) &&
              (belt.teeth == results.larger.belt.teeth ||
                belt.teeth == results.smaller.belt.teeth)
            }
          />
        </div>
      </div>
      {/* <div className="mt-8 space-y-4">
        <Suspense fallback={<div>Loading documentation...</div>}>
          <Markdown markdownContent={_beltsReadme} />
        </Suspense>
      </div> */}
    </div>
  );
}
