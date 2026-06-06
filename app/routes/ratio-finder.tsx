import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import Divider from '~/components/recalc/divider';
import BoreInput from '~/components/recalc/io/bore';
import CheckboxBooleanInput from '~/components/recalc/io/checkboxBoolean';
import NumberInput from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
import { Spinner } from '~/components/ui/spinner';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import type * as RatioFinderWorker from '~/lib/math/ratioFinder.worker';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import type { Bore } from '~/lib/types/common';
import {
  BooleanParam,
  BoreParam,
  NumberParam,
  RatioParam,
} from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Ratio Finder' },
    { name: 'description', content: 'Ratio Finder' },
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
};

const worker = new ComlinkWorker<typeof RatioFinderWorker>(
  new URL('../lib/math/ratioFinder.worker', import.meta.url),
  {
    type: 'module',
  },
);

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
  const [targetReductionErrorThreshold, _setTargetReductionErrorThreshold] =
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

  const [solutions, setSolutions] = useState<
    RatioFinderWorker.GearboxSolution[]
  >([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

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
    ],
  );

  useEffect(() => {
    setCount(0);
    setSolutions([]);
    setLoading(true);

    worker
      .findGearboxes(
        targetReduction.toDict(),
        targetReductionErrorThreshold,
        startingBore,
        filters,
      )
      .then((results) => {
        setCount(results.count);
        setSolutions(results.solutions);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setSolutions([]);
        setCount(0);
        setLoading(false);
      });
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
  });

  return (
    <div data-testid="ratio-finder-page" data-calculating={String(loading)}>
      <CalcHeading
        title="Ratio Finder"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-row flex-wrap gap-6 px-1">
        <div className="flex min-w-[300px] flex-1 flex-col">
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
                />
                <BoreInput
                  stateHook={[startingBore, setStartingBore]}
                  label="Starting Bore"
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
          </section>
        </div>

        <div className="flex min-w-[300px] flex-1 flex-col gap-x-4 gap-y-2">
          <Divider>
            {loading ? <Spinner /> : <>{count} Solutions Found</>}
          </Divider>
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
    <div className="w-full">
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
                      {gearbox.stages.map((stage, stageIndex) => (
                        <div key={stageIndex} className="text-xs">
                          <div className="mb-1 font-medium text-muted-foreground">
                            Stage {stageIndex + 1}
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
                                    - {formatPitch(sku.pitch, sku.family)}{' '}
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
                                    - {formatPitch(sku.pitch, sku.family)}{' '}
                                    {sku.family} ({sku.bore})
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
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
