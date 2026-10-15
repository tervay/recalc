import { cn } from 'cn';
import { useCallback, useMemo, useState } from 'react';
import CheckIcon from '~icons/lucide/check';
import CircleQuestionMarkIcon from '~icons/lucide/circle-question-mark';

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
import { Input } from '~/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import {
  calculateClosestCenters,
  calculateCustomBeltCenter,
} from '~/lib/math/belts';
import { Belt } from '~/lib/models/Belt';
import Measurement from '~/lib/models/Measurement';
import Pulley, { SimplePulley } from '~/lib/models/Pulley';
import {
  formatBeltCtc,
  parseBeltCtc,
  type ParsedBeltCtc,
} from '~/lib/onshapeBeltCtc';
import { buildMeta, calcTitle, pageUrl } from '~/lib/seo';
import {
  BooleanParam,
  MeasurementParam,
  NumberParam,
} from '~/lib/types/queryParams';

const BELT_PATH = '/belts';
const BELT_TITLE = calcTitle('Belt Calculator');
const BELT_NAME = 'Belt Calculator';
const FRC_DESIGN_BELTS_URL =
  'https://frcdesign.org/learning-course/stage1/1b/belts/';
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

function OnshapeImport({
  onImport,
}: {
  onImport: (parsed: ParsedBeltCtc) => void;
}) {
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseBeltCtc(text);
    setInvalid(parsed === null);
    if (parsed === null) return;
    onImport(parsed);
    setText('');
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed bg-background/50 p-3">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Import from Onshape
      </span>
      <form className="flex gap-2" onSubmit={submit}>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="#BeltCTC_5mm(70, 24, 16)"
          aria-label="Onshape BeltCTC expression"
          aria-invalid={invalid}
          data-testid="onshapeImport"
        />
        <Button
          type="submit"
          variant="outline"
          data-testid="onshapeImportButton"
        >
          Import
        </Button>
      </form>
      {invalid && (
        <p
          className="text-xs text-destructive"
          data-testid="onshapeImportError"
        >
          Expected e.g. #BeltCTC_5mm(70, 24, 16). Supported: 3mm, 5mm, RT25.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Paste a #BeltCTC expression from the Onshape Origin Cube. See the{' '}
        <a
          href={FRC_DESIGN_BELTS_URL}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          FRCDesign belt guide
        </a>{' '}
        for how to use it in Onshape.
      </p>
    </div>
  );
}

function CopyOnshapeButton({
  expression,
  testPrefix,
}: {
  expression: string;
  testPrefix: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(expression).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="ml-auto flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={copy}
        title={expression}
        data-testid={`${testPrefix}CopyOnshape`}
      >
        {copied ? 'Copied!' : 'Copy Onshape'}
      </Button>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="About Onshape export"
              data-testid={`${testPrefix}OnshapeHelp`}
            >
              <CircleQuestionMarkIcon />
            </Button>
          }
        />
        <PopoverContent className="font-normal">
          <p>
            Copies a #BeltCTC expression for the Onshape Origin Cube. Read the{' '}
            <a
              href={FRC_DESIGN_BELTS_URL}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              FRCDesign belt guide
            </a>{' '}
            to learn how to use it.
          </p>
        </PopoverContent>
      </Popover>
    </div>
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
  const [showOnshapeImport, setShowOnshapeImport] = useState(false);

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
        extraCenter,
        toothIncrement,
      ),
    [p1Teeth, p2Teeth, pitch, desiredCenter, extraCenter, toothIncrement],
  );

  const customResult = useMemo(
    () =>
      calculateCustomBeltCenter(
        new SimplePulley(p1Teeth, pitch),
        new SimplePulley(p2Teeth, pitch),
        customBeltTeeth,
        extraCenter,
      ),
    [p1Teeth, p2Teeth, pitch, customBeltTeeth, extraCenter],
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
      (useCustomBelt
        ? belt.teeth === customResult.belt.teeth
        : belt.teeth === results.larger.belt.teeth ||
          belt.teeth === results.smaller.belt.teeth),
    [
      pitch,
      useCustomBelt,
      customResult.belt.teeth,
      results.larger.belt.teeth,
      results.smaller.belt.teeth,
    ],
  );

  const importOnshape = useCallback((parsed: ParsedBeltCtc) => {
    setPitch(parsed.pitch);
    setToothIncrement(parsed.toothIncrement);
    setP1Teeth(parsed.p1Teeth);
    setP2Teeth(parsed.p2Teeth);
    setCustomBeltTeeth(parsed.beltTeeth);
    setExtraCenter(parsed.extraCenter);
    setUseCustomBelt(true);
  }, []);

  const onshapeExpression = useCallback(
    (beltTeeth: number) =>
      formatBeltCtc({ pitch, beltTeeth, p1Teeth, p2Teeth, extraCenter }),
    [pitch, p1Teeth, p2Teeth, extraCenter],
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
              <div className="flex items-center gap-3">
                <Button
                  variant={showOnshapeImport ? 'default' : 'outline'}
                  size="sm"
                  aria-expanded={showOnshapeImport}
                  onClick={() => setShowOnshapeImport(!showOnshapeImport)}
                  data-testid="onshapeImportToggle"
                >
                  Import from Onshape
                </Button>
                <BooleanInput
                  stateHook={[useCustomBelt, setUseCustomBelt]}
                  label="Use Custom Belt"
                  testId="enableCustomBelt"
                />
              </div>
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
              {showOnshapeImport && <OnshapeImport onImport={importOnshape} />}
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
                  <MeasurementInput
                    stateHook={[extraCenter, setExtraCenter]}
                    label="Extra Center"
                    testId="extraCenter"
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
            <Card className="flex-1 gap-3 py-4 shadow-sm">
              <CardHeader className="px-4">
                <CardTitle className="border-l-2 border-primary/50 pl-3">
                  Pulley 1
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2 px-4">
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

            <Card className="flex-1 gap-3 py-4 shadow-sm">
              <CardHeader className="px-4">
                <CardTitle className="border-l-2 border-primary/50 pl-3">
                  Pulley 2
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2 px-4">
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
          {useCustomBelt ? (
            <BeltResultCard
              title="Custom Belt"
              beltTeeth={customResult.belt.teeth}
              centerDistance={customResult.distance}
              p1TeethInMesh={customResult.p1TeethInMesh}
              p2TeethInMesh={customResult.p2TeethInMesh}
              gapBetweenPulleys={customResult.gapBetweenPulleys}
              onshapeExpression={onshapeExpression(customResult.belt.teeth)}
              testPrefix="custom"
            />
          ) : (
            <>
              <BeltResultCard
                title="Smaller Belt"
                isSuggested={isSmallerBeltSuggested}
                beltTeeth={results.smaller.belt.teeth}
                centerDistance={results.smaller.distance}
                p1TeethInMesh={results.smaller.p1TeethInMesh}
                p2TeethInMesh={results.smaller.p2TeethInMesh}
                gapBetweenPulleys={results.smaller.gapBetweenPulleys}
                differenceFromTarget={results.smaller.differenceFromTarget}
                onshapeExpression={onshapeExpression(
                  results.smaller.belt.teeth,
                )}
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
                onshapeExpression={onshapeExpression(results.larger.belt.teeth)}
                testPrefix="larger"
              />
            </>
          )}
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
  isSuggested = false,
  beltTeeth,
  centerDistance,
  p1TeethInMesh,
  p2TeethInMesh,
  gapBetweenPulleys,
  differenceFromTarget,
  onshapeExpression,
  testPrefix,
}: {
  title: string;
  isSuggested?: boolean;
  beltTeeth: number;
  centerDistance: Measurement;
  p1TeethInMesh: number;
  p2TeethInMesh: number;
  gapBetweenPulleys: Measurement;
  differenceFromTarget?: Measurement;
  onshapeExpression: string | null;
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
          {onshapeExpression !== null && (
            <CopyOnshapeButton
              expression={onshapeExpression}
              testPrefix={testPrefix}
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="grid grid-cols-2 gap-2">
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
        </div>
        <div className="grid grid-cols-2 items-baseline gap-x-2 gap-y-1 px-3">
          <NumberDisplayOutput
            state={p1TeethInMesh}
            label="P1 Teeth in Mesh"
            roundTo={0}
            testId={`${testPrefix}P1TeethInMesh`}
            compact
          />
          <NumberDisplayOutput
            state={p2TeethInMesh}
            label="P2 Teeth in Mesh"
            roundTo={0}
            testId={`${testPrefix}P2TeethInMesh`}
            compact
          />
          <MeasurementDisplayOutput
            state={gapBetweenPulleys}
            label="Pulley Clearance"
            defaultUnit="in"
            testId={`${testPrefix}PulleyGap`}
            compact
          />
          {differenceFromTarget !== undefined && (
            <MeasurementDisplayOutput
              state={differenceFromTarget}
              label="Error"
              defaultUnit="in"
              testId={`${testPrefix}DiffFromTarget`}
              compact
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
