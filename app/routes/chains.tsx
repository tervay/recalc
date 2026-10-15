import { cn } from 'cn';
import { useMemo, useState } from 'react';
import CheckIcon from '~icons/lucide/check';

import CalcHeading from '~/components/recalc/calcHeading';
import BooleanInput from '~/components/recalc/io/boolean';
import {
  MeasurementDisplayOutput,
  MeasurementInput,
} from '~/components/recalc/io/measurement';
import NumberInput, {
  NumberDisplayOutput,
} from '~/components/recalc/io/number';
import { SprocketTable } from '~/components/recalc/sprocketTable';
import { Button } from '~/components/ui/button';
import { ButtonGroup } from '~/components/ui/button-group';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import {
  calculateCenters,
  type ChainClosestCentersResult,
} from '~/lib/math/chains';
import Measurement from '~/lib/models/Measurement';
import { buildMeta, calcTitle, pageUrl } from '~/lib/seo';
import type { StateHook } from '~/lib/types/common';
import {
  BooleanParam,
  MeasurementParam,
  NumberParam,
} from '~/lib/types/queryParams';

type ChainResult = ChainClosestCentersResult['smaller'];

const CHAINS_PATH = '/chains';
const CHAINS_TITLE = calcTitle('Chain Calculator');
const CHAINS_NAME = 'Chain Calculator';
const CHAINS_DESCRIPTION =
  'Calculate chain drive configurations for FRC and FTC robots. Find optimal sprocket combinations and center-to-center distances for standard chain sizes.';

function SuggestedBadge() {
  return (
    <span className="flex items-center gap-1 rounded border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400">
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
      calculateCenters(
        pitch,
        p1Teeth,
        p2Teeth,
        desiredCenter,
        extraCenter,
        allowHalfLinks,
      ),
    [pitch, p1Teeth, p2Teeth, desiredCenter, extraCenter, allowHalfLinks],
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

  return (
    <div>
      <CalcHeading
        title="Chain Calculator"
        getSerializedState={() => serializedState}
      />

      <div className="flex flex-col gap-6 px-1 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-y-4">
          <div className="rounded-xl border bg-muted/20 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>Parameters</SectionLabel>
              <BooleanInput
                stateHook={[allowHalfLinks, setAllowHalfLinks]}
                label="Allow Half Links"
              />
            </div>
            <div className="flex flex-col gap-y-3">
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
              <div className="grid gap-3 md:grid-cols-2 md:gap-x-4">
                <MeasurementInput
                  stateHook={[pitch, setPitch]}
                  label="Pitch"
                  testId="pitch"
                  labelAbove
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2 md:gap-x-4">
                <MeasurementInput
                  stateHook={[desiredCenter, setDesiredCenter]}
                  label="Desired Center"
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
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <SprocketCard
              title="Sprocket 1"
              teethHook={[p1Teeth, setP1Teeth]}
              pitchDiameter={p1PitchDiameter}
              testPrefix="p1"
            />
            <SprocketCard
              title="Sprocket 2"
              teethHook={[p2Teeth, setP2Teeth]}
              pitchDiameter={p2PitchDiameter}
              testPrefix="p2"
            />
          </div>

          <ChainResultCard
            title="Smaller Chain"
            isSuggested={isSmallerChainSuggested}
            result={results.smaller}
            testPrefix="smaller"
          />
          <ChainResultCard
            title="Larger Chain"
            isSuggested={!isSmallerChainSuggested}
            result={results.larger}
            testPrefix="larger"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-y-4">
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

function SprocketCard({
  title,
  teethHook,
  pitchDiameter,
  testPrefix,
}: {
  title: string;
  teethHook: StateHook<number>;
  pitchDiameter: Measurement;
  testPrefix: string;
}) {
  return (
    <Card className="flex-1 gap-3 py-4 shadow-sm">
      <CardHeader className="px-4">
        <CardTitle className="border-l-2 border-primary/50 pl-3">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-2 px-4">
        <NumberInput
          stateHook={teethHook}
          label="Teeth"
          testId={`${testPrefix}Teeth`}
          min={1}
          labelAbove
        />
        <MeasurementDisplayOutput
          state={pitchDiameter}
          label="Pitch Diameter"
          defaultUnit="in"
          testId={`${testPrefix}PitchDiameter`}
        />
      </CardContent>
    </Card>
  );
}

function ChainResultCard({
  title,
  isSuggested,
  result,
  testPrefix,
}: {
  title: string;
  isSuggested: boolean;
  result: ChainResult;
  testPrefix: string;
}) {
  return (
    <Card
      className={cn(
        'gap-3 py-4 shadow-sm transition-colors',
        isSuggested && 'border-primary/40 ring-1 ring-primary/20',
      )}
    >
      <CardHeader className="px-4">
        <CardTitle className="flex min-h-7 items-center gap-2">
          {title}
          {isSuggested && <SuggestedBadge />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="grid grid-cols-2 gap-2">
          <NumberDisplayOutput
            state={result.links}
            label="Chain Links"
            roundTo={0}
            testId={`${testPrefix}Center`}
          />
          <MeasurementDisplayOutput
            state={result.distance}
            label="Center Distance"
            defaultUnit="in"
            testId={`${testPrefix}Distance`}
          />
        </div>
        <div className="grid grid-cols-2 items-baseline gap-x-2 gap-y-1 px-3">
          <MeasurementDisplayOutput
            state={result.differenceFromTarget}
            label="Error"
            defaultUnit="in"
            testId={`${testPrefix}DiffFromTarget`}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}
