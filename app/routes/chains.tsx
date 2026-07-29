import { useMemo, useState } from 'react';
import CheckIcon from '~icons/lucide/check';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import BooleanInput from '~/components/recalc/io/boolean';
import {
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import NumberInput, { NumberOutput } from '~/components/recalc/io/number';
import { SprocketTable } from '~/components/recalc/sprocketTable';
import { Button } from '~/components/ui/button';
import { ButtonGroup } from '~/components/ui/button-group';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import { calculateCenters } from '~/lib/math/chains';
import Measurement from '~/lib/models/Measurement';
import { buildMeta, pageUrl } from '~/lib/seo';
import {
  BooleanParam,
  MeasurementParam,
  NumberParam,
} from '~/lib/types/queryParams';

const CHAINS_PATH = '/chains';
const CHAINS_TITLE = 'FRC & FTC Chain Calculator | ReCalc';
const CHAINS_NAME = 'Chain Calculator';
const CHAINS_DESCRIPTION =
  'Calculate chain drive configurations for FRC and FTC robots. Find optimal sprocket combinations and center-to-center distances for standard chain sizes.';

export function meta() {
  return [
    ...buildMeta({
      path: CHAINS_PATH,
      title: CHAINS_TITLE,
      description: CHAINS_DESCRIPTION,
    }),
    {
      'script:ld+json': buildJsonLd(
        buildWebPage({
          url: pageUrl(CHAINS_PATH),
          name: CHAINS_NAME,
          description: CHAINS_DESCRIPTION,
          breadcrumbLabel: CHAINS_NAME,
        }),
        buildCalculatorApp({
          url: pageUrl(CHAINS_PATH),
          name: CHAINS_NAME,
          description: CHAINS_DESCRIPTION,
        }),
      ),
    },
  ];
}

const DEFAULT_PARAMS = {
  pitch: MeasurementParam.withDefault(new Measurement(0.25, 'in')),
  p1Teeth: NumberParam.withDefault(16),
  p2Teeth: NumberParam.withDefault(36),
  desiredCenter: MeasurementParam.withDefault(new Measurement(5, 'in')),
  extraCenter: MeasurementParam.withDefault(new Measurement(0, 'in')),
  allowHalfLinks: BooleanParam.withDefault(false),
};

export default function Chains() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [pitch, setPitch] = useState(queryParams.pitch);
  const [p1Teeth, setP1Teeth] = useState(queryParams.p1Teeth);
  const [p2Teeth, setP2Teeth] = useState(queryParams.p2Teeth);
  const [desiredCenter, setDesiredCenter] = useState(queryParams.desiredCenter);
  const [extraCenter, setExtraCenter] = useState(queryParams.extraCenter);
  const [allowHalfLinks, setAllowHalfLinks] = useState(
    queryParams.allowHalfLinks,
  );

  const activeChainType = useMemo(() => {
    if (pitch.eq(new Measurement(0.25, 'in'))) return '#25';
    if (pitch.eq(new Measurement(0.375, 'in'))) return '#35';
    if (pitch.eq(new Measurement(8, 'mm'))) return '8mm';
    return null;
  }, [pitch]);

  const p1PitchDiameter = useMemo(() => {
    return pitch.mul(p1Teeth).div(Math.PI);
  }, [p1Teeth, pitch]);

  const p2PitchDiameter = useMemo(() => {
    return pitch.mul(p2Teeth).div(Math.PI);
  }, [p2Teeth, pitch]);

  const results = useMemo(
    () =>
      calculateCenters(pitch, p1Teeth, p2Teeth, desiredCenter, allowHalfLinks),
    [pitch, p1Teeth, p2Teeth, desiredCenter, allowHalfLinks],
  );

  const isSmallerChainSuggested = useMemo(
    () =>
      results.smaller.differenceFromTarget
        .abs()
        .lte(results.larger.differenceFromTarget.abs()),
    [results.smaller.differenceFromTarget, results.larger.differenceFromTarget],
  );

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    pitch,
    p1Teeth,
    p2Teeth,
    desiredCenter,
    extraCenter,
    allowHalfLinks,
  });

  function SuggestedBadge() {
    return (
      <span className="flex items-center gap-1 rounded border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400">
        <CheckIcon className="size-3" />
        Suggested
      </span>
    );
  }

  return (
    <div>
      <CalcHeading
        title="Chain Calculator"
        getSerializedState={() => serializedState}
      />

      <div className="flex flex-col gap-4 px-1 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-2">
          <div className="flex flex-wrap gap-y-2">
            <ButtonGroup>
              <Button
                variant={activeChainType === '#25' ? 'default' : 'outline'}
                onClick={() => setPitch(new Measurement(0.25, 'in'))}
              >
                #25
              </Button>
              <Button
                variant={activeChainType === '#35' ? 'default' : 'outline'}
                onClick={() => setPitch(new Measurement(0.375, 'in'))}
              >
                #35
              </Button>
              <Button
                variant={activeChainType === '8mm' ? 'default' : 'outline'}
                onClick={() => setPitch(new Measurement(8, 'mm'))}
              >
                8mm
              </Button>
            </ButtonGroup>
          </div>

          <IOLine className="flex-col md:flex-row">
            <MeasurementInput
              stateHook={[pitch, setPitch]}
              label="Pitch"
              testId="pitch"
              labelAbove
            />
            <div className="flex flex-col">
              <div className="mb-1 text-xs" aria-hidden>
                {' '}
              </div>
              <div className="flex h-9 items-center">
                <BooleanInput
                  stateHook={[allowHalfLinks, setAllowHalfLinks]}
                  label="Allow Half Links"
                />
              </div>
            </div>
          </IOLine>

          <IOLine className="flex-col md:flex-row">
            <MeasurementInput
              stateHook={[desiredCenter, setDesiredCenter]}
              label="Desired Center"
              testId="desiredCenter"
            />
            <MeasurementInput
              stateHook={[extraCenter, setExtraCenter]}
              label="Extra Center"
              testId="extraCenter"
            />
          </IOLine>

          <div className="flex flex-col gap-2 md:flex-row">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Sprocket 1</CardTitle>
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
                <CardTitle>Sprocket 2</CardTitle>
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
                Smaller Chain
                {isSmallerChainSuggested && <SuggestedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-2">
              <IOLine className="flex-col md:flex-row">
                <NumberOutput
                  state={results.smaller.links}
                  label="Chain Links"
                  roundTo={0}
                  testId="smallerCenter"
                />
                <MeasurementOutput
                  state={results.smaller.distance}
                  label="Center Distance"
                  defaultUnit="in"
                  testId="smallerDistance"
                />
              </IOLine>
              <IOLine>
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
                Larger Chain
                {!isSmallerChainSuggested && <SuggestedBadge />}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-2">
              <IOLine className="flex-col md:flex-row">
                <NumberOutput
                  state={results.larger.links}
                  label="Chain Links"
                  roundTo={0}
                  testId="largerCenter"
                />
                <MeasurementOutput
                  state={results.larger.distance}
                  label="Center Distance"
                  defaultUnit="in"
                  testId="largerDistance"
                />
              </IOLine>
              <IOLine>
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

        <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-4">
          <SprocketTable
            filterFn={(sprocket) =>
              sprocket.pitch.eq(pitch) &&
              (sprocket.teeth === p1Teeth || sprocket.teeth === p2Teeth)
            }
          />
        </div>
      </div>
    </div>
  );
}
