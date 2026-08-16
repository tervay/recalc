import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import Divider from '~/components/recalc/divider';
import BoreInput from '~/components/recalc/io/bore';
import CheckboxBooleanInput from '~/components/recalc/io/checkboxBoolean';
import NumberInput from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { Spinner } from '~/components/ui/spinner';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import type * as RatioFinderWorker from '~/lib/math/ratioFinder.worker';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { buildMeta, pageUrl } from '~/lib/seo';
import type { Bore, StageFamily } from '~/lib/types/common';
import { STAGE_FAMILIES } from '~/lib/types/common';
import {
  BooleanParam,
  BoreParam,
  NumberParam,
  RatioParam,
  StageConstraintListParam,
} from '~/lib/types/queryParams';

const RATIO_FINDER_PATH = '/ratio-finder';
const RATIO_FINDER_TITLE = 'FRC & FTC Gear Ratio Finder | ReCalc';
const RATIO_FINDER_NAME = 'Ratio Finder';
const RATIO_FINDER_DESCRIPTION =
  'Find optimal gear, belt, and chain drive ratios for FRC and FTC robots. Search through combinations of sprockets, pulleys, and gears to hit a target reduction.';

export function meta() {
  return [
    ...buildMeta({
      path: RATIO_FINDER_PATH,
      title: RATIO_FINDER_TITLE,
      description: RATIO_FINDER_DESCRIPTION,
    }),
    {
      'script:ld+json': buildJsonLd(
        buildWebPage({
          url: pageUrl(RATIO_FINDER_PATH),
          name: RATIO_FINDER_NAME,
          description: RATIO_FINDER_DESCRIPTION,
          breadcrumbLabel: RATIO_FINDER_NAME,
        }),
        buildCalculatorApp({
          url: pageUrl(RATIO_FINDER_PATH),
          name: RATIO_FINDER_NAME,
          description: RATIO_FINDER_DESCRIPTION,
        }),
      ),
    },
  ];
}

const DEFAULT_PARAMS = {
  minGearTeeth: NumberParam.withDefault(6),
  maxGearTeeth: NumberParam.withDefault(84),
  minPulleyTeeth: NumberParam.withDefault(8),
  maxPulleyTeeth: NumberParam.withDefault(84),
  minSprocketTeeth: NumberParam.withDefault(8),
  maxSprocketTeeth: NumberParam.withDefault(84),
  enableREV: BooleanParam.withDefault(true),
  enableWCP: BooleanParam.withDefault(true),
  enableAM: BooleanParam.withDefault(true),
  enableTTB: BooleanParam.withDefault(true),
  enableLastAnvil: BooleanParam.withDefault(true),
  enableSDS: BooleanParam.withDefault(true),
  enablePlanetaries: BooleanParam.withDefault(true),
  enable20DP: BooleanParam.withDefault(true),
  enable32DP: BooleanParam.withDefault(false),
  enableGT2: BooleanParam.withDefault(false),
  enableHTD: BooleanParam.withDefault(true),
  enableRT25: BooleanParam.withDefault(true),
  enable25Chain: BooleanParam.withDefault(true),
  enable35Chain: BooleanParam.withDefault(true),
  enableBore12Hex: BooleanParam.withDefault(true),
  enableBore38Hex: BooleanParam.withDefault(false),
  enableBore1125: BooleanParam.withDefault(false),
  enableBoreMAXSpline: BooleanParam.withDefault(true),
  enableBoreSplineXL: BooleanParam.withDefault(true),
  enableBore5mmHex: BooleanParam.withDefault(false),
  enableBore14Round: BooleanParam.withDefault(false),
  targetReduction: RatioParam.withDefault(new Ratio(20, RatioType.REDUCTION)),
  targetReductionErrorThreshold: NumberParam.withDefault(0.25),
  enableCustomGears: BooleanParam.withDefault(false),
  enableCustomPulleys: BooleanParam.withDefault(false),
  enableCustomSprockets: BooleanParam.withDefault(false),
  startingBore: BoreParam.withDefault('SplineXS' as Bore),
  // Empty array == "Auto" (unconstrained stage count and per-stage type).
  stageConstraints: StageConstraintListParam.withDefault([]),
};

// Constructed lazily (not at module scope) so importing this route module
// never touches the `Worker` global — required for prerendering, where the
// route component is rendered in Node and `Worker` does not exist. Every
// call site below is inside a useEffect, so the getter is only ever invoked
// client-side.
function createWorker() {
  return new ComlinkWorker<typeof RatioFinderWorker>(
    new URL('../lib/math/ratioFinder.worker', import.meta.url),
    {
      type: 'module',
    },
  );
}

let workerInstance: ReturnType<typeof createWorker> | undefined;

function getWorker() {
  workerInstance ??= createWorker();
  return workerInstance;
}

export default function RatioFinder() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [minGearTeeth, setMinGearTeeth] = useState(queryParams.minGearTeeth);
  const [maxGearTeeth, setMaxGearTeeth] = useState(queryParams.maxGearTeeth);
  const [minPulleyTeeth, setMinPulleyTeeth] = useState(
    queryParams.minPulleyTeeth,
  );
  const [maxPulleyTeeth, setMaxPulleyTeeth] = useState(
    queryParams.maxPulleyTeeth,
  );
  const [minSprocketTeeth, setMinSprocketTeeth] = useState(
    queryParams.minSprocketTeeth,
  );
  const [maxSprocketTeeth, setMaxSprocketTeeth] = useState(
    queryParams.maxSprocketTeeth,
  );
  const [enableREV, setEnableREV] = useState(queryParams.enableREV);
  const [enableWCP, setEnableWCP] = useState(queryParams.enableWCP);
  const [enableAM, setEnableAM] = useState(queryParams.enableAM);
  const [enableTTB, setEnableTTB] = useState(queryParams.enableTTB);
  const [enableLastAnvil, setEnableLastAnvil] = useState(
    queryParams.enableLastAnvil,
  );
  const [enableSDS, setEnableSDS] = useState(queryParams.enableSDS);
  const [enablePlanetaries, setEnablePlanetaries] = useState(
    queryParams.enablePlanetaries,
  );
  const [enable20DP, setEnable20DP] = useState(queryParams.enable20DP);
  const [enable32DP, setEnable32DP] = useState(queryParams.enable32DP);
  const [enableGT2, setEnableGT2] = useState(queryParams.enableGT2);
  const [enableHTD, setEnableHTD] = useState(queryParams.enableHTD);
  const [enableRT25, setEnableRT25] = useState(queryParams.enableRT25);
  const [enable25Chain, setEnable25Chain] = useState(queryParams.enable25Chain);
  const [enable35Chain, setEnable35Chain] = useState(queryParams.enable35Chain);
  const [enableBore12Hex, setEnableBore12Hex] = useState(
    queryParams.enableBore12Hex,
  );
  const [enableBore38Hex, setEnableBore38Hex] = useState(
    queryParams.enableBore38Hex,
  );
  const [enableBore1125, setEnableBore1125] = useState(
    queryParams.enableBore1125,
  );
  const [enableBoreMAXSpline, setEnableBoreMAXSpline] = useState(
    queryParams.enableBoreMAXSpline,
  );
  const [enableBoreSplineXL, setEnableBoreSplineXL] = useState(
    queryParams.enableBoreSplineXL,
  );
  const [enableBore5mmHex, setEnableBore5mmHex] = useState(
    queryParams.enableBore5mmHex,
  );
  const [enableBore14Round, setEnableBore14Round] = useState(
    queryParams.enableBore14Round,
  );
  const [targetReduction, setTargetReduction] = useState(
    queryParams.targetReduction,
  );
  const [targetReductionErrorThreshold, setTargetReductionErrorThreshold] =
    useState(queryParams.targetReductionErrorThreshold);
  const [enableCustomGears, setEnableCustomGears] = useState(
    queryParams.enableCustomGears,
  );
  const [enableCustomPulleys, setEnableCustomPulleys] = useState(
    queryParams.enableCustomPulleys,
  );
  const [enableCustomSprockets, setEnableCustomSprockets] = useState(
    queryParams.enableCustomSprockets,
  );
  const [startingBore, setStartingBore] = useState(queryParams.startingBore);

  // Per-stage transmission-type filters, applied positionally: the Stage 1
  // filter governs every solution's first stage, Stage 2 the second, Stage 3 a
  // third stage. The finder searches one or two stages and only falls back to
  // three when nothing else reaches the target, so the Stage 3 filter only
  // matters in that case. Each defaults to all families; an empty stage means
  // "any type".
  const initialStageConstraints = queryParams.stageConstraints;
  const [stage1Families, setStage1Families] = useState<StageFamily[]>(
    initialStageConstraints[0] ?? [...STAGE_FAMILIES],
  );
  const [stage2Families, setStage2Families] = useState<StageFamily[]>(
    initialStageConstraints[1] ?? [...STAGE_FAMILIES],
  );
  const [stage3Families, setStage3Families] = useState<StageFamily[]>(
    initialStageConstraints[2] ?? [...STAGE_FAMILIES],
  );

  const stageConstraints = useMemo<StageFamily[][]>(
    () => [stage1Families, stage2Families, stage3Families],
    [stage1Families, stage2Families, stage3Families],
  );

  const [solutions, setSolutions] = useState<
    RatioFinderWorker.GearboxSolution[]
  >([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // True when the only gearboxes found needed a third stage.
  const [autoExpandedToThreeStage, setAutoExpandedToThreeStage] =
    useState(false);

  const filters: RatioFinderWorker.FindGearboxesFilters = useMemo(
    () => ({
      minGearTeeth,
      maxGearTeeth,
      minPulleyTeeth,
      maxPulleyTeeth,
      minSprocketTeeth,
      maxSprocketTeeth,
      enableREV,
      enableWCP,
      enableAM,
      enableTTB,
      enableLastAnvil,
      enableSDS,
      enablePlanetaries,
      enableBore5mmHex,
      enable20DP,
      enable32DP,
      enableGT2,
      enableHTD,
      enableRT25,
      enable25Chain,
      enable35Chain,
      enableBore12Hex,
      enableBore38Hex,
      enableBore1125,
      enableBoreMAXSpline,
      enableBoreSplineXL,
      enableBore14Round,
      enableCustomGears,
      enableCustomPulleys,
      enableCustomSprockets,
      stageConstraints,
    }),
    [
      minGearTeeth,
      maxGearTeeth,
      minPulleyTeeth,
      maxPulleyTeeth,
      minSprocketTeeth,
      maxSprocketTeeth,
      enableREV,
      enableWCP,
      enableAM,
      enableTTB,
      enableLastAnvil,
      enableSDS,
      enablePlanetaries,
      enableBore5mmHex,
      enable20DP,
      enable32DP,
      enableGT2,
      enableHTD,
      enableRT25,
      enable25Chain,
      enable35Chain,
      enableBore12Hex,
      enableBore38Hex,
      enableBore1125,
      enableBoreMAXSpline,
      enableBoreSplineXL,
      enableBore14Round,
      enableCustomGears,
      enableCustomPulleys,
      enableCustomSprockets,
      stageConstraints,
    ],
  );

  useEffect(() => {
    // findGearboxes is async (it awaits dynamic data imports), so successive
    // calls interleave inside the worker and may resolve out of order. Ignore
    // any response that arrives after the inputs have changed so a slower,
    // stale request can never overwrite the latest results.
    let cancelled = false;

    setCount(0);
    setSolutions([]);
    setLoading(true);

    getWorker()
      .findGearboxes(
        targetReduction.toDict(),
        targetReductionErrorThreshold,
        startingBore,
        filters,
      )
      .then((results) => {
        if (cancelled) {
          return;
        }
        setCount(results.count);
        setSolutions(results.solutions);
        setAutoExpandedToThreeStage(results.autoExpandedToThreeStage);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        setSolutions([]);
        setCount(0);
        setAutoExpandedToThreeStage(false);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetReduction, targetReductionErrorThreshold, startingBore, filters]);

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    minGearTeeth,
    maxGearTeeth,
    minPulleyTeeth,
    maxPulleyTeeth,
    minSprocketTeeth,
    maxSprocketTeeth,
    enableREV,
    enableWCP,
    enableAM,
    enableTTB,
    enableLastAnvil,
    enableSDS,
    enablePlanetaries,
    enable20DP,
    enable32DP,
    enableGT2,
    enableHTD,
    enableRT25,
    enable25Chain,
    enable35Chain,
    enableBore12Hex,
    enableBore38Hex,
    enableBore1125,
    enableBoreMAXSpline,
    enableBoreSplineXL,
    enableBore5mmHex,
    enableBore14Round,
    targetReduction,
    targetReductionErrorThreshold,
    enableCustomGears,
    enableCustomPulleys,
    enableCustomSprockets,
    startingBore,
    stageConstraints,
  });

  return (
    <div data-testid="ratio-finder-page" data-calculating={String(loading)}>
      <CalcHeading
        title="Ratio Finder"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-row flex-wrap gap-6 px-1">
        <div className="flex min-w-75 flex-1 flex-col">
          <section className="flex flex-col rounded-lg border">
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Target Settings
              </h2>
              <IOLine>
                <RatioInput
                  stateHook={[targetReduction, setTargetReduction]}
                  debounceDelay={300}
                  labelAbove
                  testId="reduction-magnitude"
                />
                <BoreInput
                  stateHook={[startingBore, setStartingBore]}
                  label="Starting Bore"
                  labelAbove
                />
                <NumberInput
                  stateHook={[
                    targetReductionErrorThreshold,
                    setTargetReductionErrorThreshold,
                  ]}
                  label="Target Error Threshold"
                  labelAbove
                />
              </IOLine>
            </div>
            <div className="border-t" />

            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Tooth Ranges
              </h2>
              <IOLine>
                <NumberInput
                  stateHook={[minGearTeeth, setMinGearTeeth]}
                  label="Min Gear Teeth"
                  labelAbove
                />
                <NumberInput
                  stateHook={[maxGearTeeth, setMaxGearTeeth]}
                  label="Max Gear Teeth"
                  labelAbove
                />
              </IOLine>
              <IOLine>
                <NumberInput
                  stateHook={[minPulleyTeeth, setMinPulleyTeeth]}
                  label="Min Pulley Teeth"
                  labelAbove
                />
                <NumberInput
                  stateHook={[maxPulleyTeeth, setMaxPulleyTeeth]}
                  label="Max Pulley Teeth"
                  labelAbove
                />
              </IOLine>
              <IOLine>
                <NumberInput
                  stateHook={[minSprocketTeeth, setMinSprocketTeeth]}
                  label="Min Sprocket Teeth"
                  labelAbove
                />
                <NumberInput
                  stateHook={[maxSprocketTeeth, setMaxSprocketTeeth]}
                  label="Max Sprocket Teeth"
                  labelAbove
                />
              </IOLine>
            </div>
            <div className="border-t" />

            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Filters
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-card p-3">
                  <h3 className="mb-2 text-center text-sm font-semibold text-muted-foreground">
                    Gears
                  </h3>
                  <div className="flex flex-col gap-2">
                    <CheckboxBooleanInput
                      stateHook={[enable20DP, setEnable20DP]}
                      label="20DP"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enable32DP, setEnable32DP]}
                      label="32DP"
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <h3 className="mb-2 text-center text-sm font-semibold text-muted-foreground">
                    Pulleys
                  </h3>
                  <div className="flex flex-col gap-2">
                    <CheckboxBooleanInput
                      stateHook={[enableGT2, setEnableGT2]}
                      label="GT2"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableHTD, setEnableHTD]}
                      label="HTD"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableRT25, setEnableRT25]}
                      label="RT25"
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <h3 className="mb-2 text-center text-sm font-semibold text-muted-foreground">
                    Sprockets
                  </h3>
                  <div className="flex flex-col gap-2">
                    <CheckboxBooleanInput
                      stateHook={[enable25Chain, setEnable25Chain]}
                      label="#25"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enable35Chain, setEnable35Chain]}
                      label="#35"
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <h3 className="mb-2 text-center text-sm font-semibold text-muted-foreground">
                    Vendors
                  </h3>
                  <div className="flex flex-col gap-2">
                    <CheckboxBooleanInput
                      stateHook={[enableAM, setEnableAM]}
                      label="AndyMark"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableLastAnvil, setEnableLastAnvil]}
                      label="LastAnvil"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableSDS, setEnableSDS]}
                      label="SDS"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableREV, setEnableREV]}
                      label="REV"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableTTB, setEnableTTB]}
                      label="Thrifty"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableWCP, setEnableWCP]}
                      label="WCP"
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <h3 className="mb-2 text-center text-sm font-semibold text-muted-foreground">
                    Bores
                  </h3>
                  <div className="flex flex-col gap-2">
                    <CheckboxBooleanInput
                      stateHook={[enableBore12Hex, setEnableBore12Hex]}
                      label='1/2" Hex'
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableBoreMAXSpline, setEnableBoreMAXSpline]}
                      label="MAXSpline"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableBoreSplineXL, setEnableBoreSplineXL]}
                      label="SplineXL"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableBore38Hex, setEnableBore38Hex]}
                      label='3/8" Hex'
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableBore1125, setEnableBore1125]}
                      label='1.125" Round'
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableBore5mmHex, setEnableBore5mmHex]}
                      label="5mm Hex"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableBore14Round, setEnableBore14Round]}
                      label='1/4" Round'
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <h3 className="mb-2 text-center text-sm font-semibold text-muted-foreground">
                    Other
                  </h3>
                  <div className="flex flex-col gap-2">
                    <CheckboxBooleanInput
                      stateHook={[enablePlanetaries, setEnablePlanetaries]}
                      label="Planetaries"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableCustomGears, setEnableCustomGears]}
                      label="Custom Gears"
                    />
                    <CheckboxBooleanInput
                      stateHook={[enableCustomPulleys, setEnableCustomPulleys]}
                      label="Custom Pulleys"
                    />
                    <CheckboxBooleanInput
                      stateHook={[
                        enableCustomSprockets,
                        setEnableCustomSprockets,
                      ]}
                      label="Custom Sprockets"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t" />

            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Transmission Type Per Stage
              </h2>
              <p className="text-xs text-muted-foreground">
                Restrict which power transmission types each stage may use. The
                finder searches one or two stages and only adds a third stage
                when nothing else reaches the target, so the Stage 3 filter
                applies only in that case.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <StageFamilySelect
                  families={stage1Families}
                  setFamilies={setStage1Families}
                  label="Stage 1"
                  testId="stage-1-families"
                />
                <StageFamilySelect
                  families={stage2Families}
                  setFamilies={setStage2Families}
                  label="Stage 2"
                  testId="stage-2-families"
                />
                <StageFamilySelect
                  families={stage3Families}
                  setFamilies={setStage3Families}
                  label="Stage 3"
                  testId="stage-3-families"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="flex min-w-75 flex-1 flex-col gap-x-4 gap-y-2">
          <Divider>
            {loading ? <Spinner /> : <>{count} Solutions Found</>}
          </Divider>
          {autoExpandedToThreeStage && (
            <div
              className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
              data-testid="three-stage-notice"
            >
              No one or two-stage gearbox reaches this ratio with the current
              filters — showing three-stage options.
            </div>
          )}
          {solutions.length === 0 ? (
            <div className="text-muted-foreground">No solutions found</div>
          ) : (
            <GearboxList gearboxes={solutions} />
          )}
        </div>
      </div>
    </div>
  );
}

function StageFamilySelect({
  families,
  setFamilies,
  label,
  testId,
}: {
  families: StageFamily[];
  setFamilies: Dispatch<SetStateAction<StageFamily[]>>;
  label: string;
  testId?: string;
}) {
  // Use a functional update so rapid successive toggles each compose on the
  // latest selection rather than a value captured at render time.
  const toggle = (family: StageFamily, checked: boolean) => {
    setFamilies((prev) =>
      checked ? [...prev, family] : prev.filter((f) => f !== family),
    );
  };

  return (
    <div className="rounded-lg border bg-card p-3" data-testid={testId}>
      <h3 className="mb-2 text-center text-sm font-semibold text-muted-foreground">
        {label}
      </h3>
      <div className="flex flex-col gap-2">
        {STAGE_FAMILIES.map((family) => (
          <div key={family} className="flex flex-row items-center gap-2">
            <Checkbox
              aria-label={`${label} ${family}`}
              checked={families.includes(family)}
              onCheckedChange={(checked) => toggle(family, checked === true)}
            />
            <Label>{family}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Human-facing transmission family for a matched SKU. */
function skuFamilyLabel(
  family: 'Gear' | 'Pulley' | 'Sprocket' | 'Planetary',
): string {
  if (family === 'Pulley') {
    return 'Belt';
  }
  if (family === 'Sprocket') {
    return 'Chain';
  }
  return family;
}

export function GearboxList({
  gearboxes,
}: {
  gearboxes: RatioFinderWorker.GearboxSolution[];
}) {
  const formatPitch = (
    pitch: string,
    family: 'Gear' | 'Pulley' | 'Sprocket' | 'Planetary',
  ) => {
    if (family === 'Gear') {
      return `${pitch}DP`;
    }
    if (family === 'Pulley') {
      if (pitch === '5') {
        return 'HTD';
      }
      if (pitch === '3') {
        return 'GT2';
      }
      return 'RT25';
    }

    return pitch;
  };
  return (
    <div className="w-full" data-testid="gearbox-list">
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Ratio
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Stages
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Components
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gearboxes.map((gearbox, index) => (
                <tr
                  key={index}
                  aria-label={`Gearbox solution ${index + 1}: ${gearbox.ratio.toFixed(2)}:1`}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-3 py-3">
                    <div className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
                      {gearbox.ratio.toFixed(2)}:1
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      {gearbox.stages.map((stage, stageIndex) => (
                        <div
                          key={stageIndex}
                          className="text-center text-sm font-semibold"
                        >
                          {stage.from.teeth}:{stage.to.teeth}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-2">
                      {gearbox.stages.map((stage, stageIndex) => {
                        const stageFamilies = [
                          ...new Set(
                            [...stage.from.skus, ...stage.to.skus].map((sku) =>
                              skuFamilyLabel(sku.family),
                            ),
                          ),
                        ];
                        return (
                          <div key={stageIndex} className="text-xs">
                            <div className="mb-1 font-medium text-muted-foreground">
                              Stage {stageIndex + 1}
                              {stageFamilies.length > 0 && (
                                <span className="ml-1 font-normal">
                                  ({stageFamilies.join(', ')})
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                                  {stage.from.teeth}T
                                </div>
                                {stage.from.skus.map((sku, skuIndex) => (
                                  <Link
                                    key={skuIndex}
                                    to={sku.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded border border-border bg-muted/50 p-1.5 text-[11px] transition-colors hover:bg-muted"
                                  >
                                    <span className="font-semibold">
                                      {sku.sku}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {' '}
                                      - {formatPitch(
                                        sku.pitch,
                                        sku.family,
                                      )}{' '}
                                      {sku.family} ({sku.bore})
                                    </span>
                                  </Link>
                                ))}
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
                                  {stage.to.teeth}T
                                </div>
                                {stage.to.skus.map((sku, skuIndex) => (
                                  <Link
                                    key={skuIndex}
                                    to={sku.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded border border-border bg-muted/50 p-1.5 text-[11px] transition-colors hover:bg-muted"
                                  >
                                    <span className="font-semibold">
                                      {sku.sku}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {' '}
                                      - {formatPitch(
                                        sku.pitch,
                                        sku.family,
                                      )}{' '}
                                      {sku.family} ({sku.bore})
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
