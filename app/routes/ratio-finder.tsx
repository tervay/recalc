import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import Divider from '~/components/recalc/divider';
import BooleanInput from '~/components/recalc/io/boolean';
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
  withDefault,
} from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Ratio Finder' },
    { name: 'description', content: 'Ratio Finder' },
  ];
}

const DEFAULT_PARAMS = {
  minGearTeeth: withDefault(NumberParam, 6),
  maxGearTeeth: withDefault(NumberParam, 84),
  minPulleyTeeth: withDefault(NumberParam, 8),
  maxPulleyTeeth: withDefault(NumberParam, 84),
  minSprocketTeeth: withDefault(NumberParam, 8),
  maxSprocketTeeth: withDefault(NumberParam, 84),
  enableREV: withDefault(BooleanParam, true),
  enableWCP: withDefault(BooleanParam, true),
  enableAM: withDefault(BooleanParam, true),
  enableTTB: withDefault(BooleanParam, true),
  enablePlanetaries: withDefault(BooleanParam, true),
  enable20DP: withDefault(BooleanParam, true),
  enable32DP: withDefault(BooleanParam, false),
  enableGT2: withDefault(BooleanParam, false),
  enableHTD: withDefault(BooleanParam, true),
  enableRT25: withDefault(BooleanParam, true),
  enable25Chain: withDefault(BooleanParam, true),
  enable35Chain: withDefault(BooleanParam, true),
  enableBore12Hex: withDefault(BooleanParam, true),
  enableBore38Hex: withDefault(BooleanParam, false),
  enableBore1125: withDefault(BooleanParam, false),
  enableBoreMAXSpline: withDefault(BooleanParam, true),
  enableBoreSplineXL: withDefault(BooleanParam, true),
  enableBore5mmHex: withDefault(BooleanParam, false),
  targetReduction: withDefault(RatioParam, new Ratio(20, RatioType.REDUCTION)),
  targetReductionErrorThreshold: withDefault(NumberParam, 0.1),
  enablePrintedPulleys: withDefault(BooleanParam, false),
  startingBore: withDefault(BoreParam, '8mm'),
};

const worker = new ComlinkWorker<typeof RatioFinderWorker>(
  new URL('../lib/math/ratioFinder.worker', import.meta.url),
  {
    type: 'module',
  },
);

export default function RatioFinder() {
  const queryParams = useQueryParams<{
    minGearTeeth: number;
    maxGearTeeth: number;
    minPulleyTeeth: number;
    maxPulleyTeeth: number;
    minSprocketTeeth: number;
    maxSprocketTeeth: number;
    enableREV: boolean;
    enableWCP: boolean;
    enableAM: boolean;
    enableTTB: boolean;
    enablePlanetaries: boolean;
    enable20DP: boolean;
    enable32DP: boolean;
    enableGT2: boolean;
    enableHTD: boolean;
    enableRT25: boolean;
    enable25Chain: boolean;
    enable35Chain: boolean;
    enableBore12Hex: boolean;
    enableBore38Hex: boolean;
    enableBore1125: boolean;
    enableBoreMAXSpline: boolean;
    enableBoreSplineXL: boolean;
    enableBore5mmHex: boolean;
    targetReduction: Ratio;
    targetReductionErrorThreshold: number;
    enablePrintedPulleys: boolean;
    startingBore: Bore;
  }>(DEFAULT_PARAMS);

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
  const [targetReduction, setTargetReduction] = useState(
    queryParams.targetReduction,
  );
  const [targetReductionErrorThreshold, setTargetReductionErrorThreshold] =
    useState(queryParams.targetReductionErrorThreshold);
  const [enablePrintedPulleys, setEnablePrintedPulleys] = useState(
    queryParams.enablePrintedPulleys,
  );
  const [startingBore, _setStartingBore] = useState(queryParams.startingBore);

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
      enablePrintedPulleys,
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
      enablePrintedPulleys,
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
    targetReduction,
    targetReductionErrorThreshold,
    enablePrintedPulleys,
    startingBore,
  });

  return (
    <div>
      <CalcHeading
        title="Ratio Finder"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-col gap-4 px-1 *:flex-1 md:flex-row md:gap-x-4">
        <div className="flex flex-col gap-x-4 gap-y-2">
          <Divider>Target Settings</Divider>
          <IOLine>
            <RatioInput stateHook={[targetReduction, setTargetReduction]} />
            <NumberInput
              stateHook={[
                targetReductionErrorThreshold,
                setTargetReductionErrorThreshold,
              ]}
              label="Error Threshold"
            />
          </IOLine>

          <Divider>Tooth Ranges</Divider>
          <IOLine>
            <NumberInput
              stateHook={[minGearTeeth, setMinGearTeeth]}
              label="Min Gear Teeth"
            />
            <NumberInput
              stateHook={[maxGearTeeth, setMaxGearTeeth]}
              label="Max Gear Teeth"
            />
          </IOLine>
          <IOLine>
            <NumberInput
              stateHook={[minPulleyTeeth, setMinPulleyTeeth]}
              label="Min Pulley Teeth"
            />
            <NumberInput
              stateHook={[maxPulleyTeeth, setMaxPulleyTeeth]}
              label="Max Pulley Teeth"
            />
          </IOLine>
          <IOLine>
            <NumberInput
              stateHook={[minSprocketTeeth, setMinSprocketTeeth]}
              label="Min Sprocket Teeth"
            />
            <NumberInput
              stateHook={[maxSprocketTeeth, setMaxSprocketTeeth]}
              label="Max Sprocket Teeth"
            />
          </IOLine>

          <Divider>Vendor Filters</Divider>
          <IOLine>
            <BooleanInput stateHook={[enableREV, setEnableREV]} label="REV" />
            <BooleanInput stateHook={[enableWCP, setEnableWCP]} label="WCP" />
            <BooleanInput
              stateHook={[enableAM, setEnableAM]}
              label="AndyMark"
            />
            <BooleanInput
              stateHook={[enableTTB, setEnableTTB]}
              label="Thrifty"
            />
          </IOLine>

          <Divider>Gear Pitch Filters</Divider>
          <IOLine>
            <BooleanInput
              stateHook={[enable20DP, setEnable20DP]}
              label="20DP"
            />
            <BooleanInput
              stateHook={[enable32DP, setEnable32DP]}
              label="32DP"
            />
          </IOLine>

          <Divider>Pulley Profile Filters</Divider>
          <IOLine>
            <BooleanInput stateHook={[enableGT2, setEnableGT2]} label="GT2" />
            <BooleanInput stateHook={[enableHTD, setEnableHTD]} label="HTD" />
            <BooleanInput
              stateHook={[enableRT25, setEnableRT25]}
              label="RT25"
            />
          </IOLine>

          <Divider>Chain Type Filters</Divider>
          <IOLine>
            <BooleanInput
              stateHook={[enable25Chain, setEnable25Chain]}
              label="#25"
            />
            <BooleanInput
              stateHook={[enable35Chain, setEnable35Chain]}
              label="#35"
            />
          </IOLine>

          <Divider>Bore Filters</Divider>
          <IOLine>
            <BooleanInput
              stateHook={[enableBore12Hex, setEnableBore12Hex]}
              label='1/2" Hex'
            />
            <BooleanInput
              stateHook={[enableBore38Hex, setEnableBore38Hex]}
              label='3/8" Hex'
            />
            <BooleanInput
              stateHook={[enableBore1125, setEnableBore1125]}
              label='1.125" Round'
            />
            <BooleanInput
              stateHook={[enableBoreMAXSpline, setEnableBoreMAXSpline]}
              label="MAXSpline"
            />
            <BooleanInput
              stateHook={[enableBoreSplineXL, setEnableBoreSplineXL]}
              label="SplineXL"
            />
            <BooleanInput
              stateHook={[enableBore5mmHex, setEnableBore5mmHex]}
              label="5mm Hex"
            />
          </IOLine>

          <Divider>Other</Divider>
          <IOLine>
            <BooleanInput
              stateHook={[enablePlanetaries, setEnablePlanetaries]}
              label="Enable Planetaries"
            />
            <BooleanInput
              stateHook={[enablePrintedPulleys, setEnablePrintedPulleys]}
              label="Enable Printed Pulleys"
            />
          </IOLine>
        </div>

        <div className="flex flex-col gap-x-4 gap-y-2">
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
                <th
                  className="px-3 py-2 text-left text-xs font-semibold
                    tracking-wider text-muted-foreground uppercase"
                >
                  Ratio
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-semibold
                    tracking-wider text-muted-foreground uppercase"
                >
                  Stages
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-semibold
                    tracking-wider text-muted-foreground uppercase"
                >
                  Components
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gearboxes.map((gearbox, index) => (
                <tr key={index} className="transition-colors hover:bg-muted/30">
                  <td className="px-3 py-3">
                    <div
                      className="inline-flex items-center gap-1 rounded
                        bg-primary/10 px-2 py-1 text-sm font-semibold
                        text-primary"
                    >
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
                          <div
                            className="mb-1 font-medium text-muted-foreground"
                          >
                            Stage {stageIndex + 1}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <div
                                className="text-[10px] tracking-wide
                                  text-muted-foreground uppercase"
                              >
                                {stage.from.teeth}T
                              </div>
                              {stage.from.skus.map((sku, skuIndex) => (
                                <Link
                                  key={skuIndex}
                                  to={sku.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded border border-border
                                    bg-muted/50 p-1.5 text-[11px]
                                    transition-colors hover:bg-muted"
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
                              <div
                                className="text-[10px] tracking-wide
                                  text-muted-foreground uppercase"
                              >
                                {stage.to.teeth}T
                              </div>
                              {stage.to.skus.map((sku, skuIndex) => (
                                <Link
                                  key={skuIndex}
                                  to={sku.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded border border-border
                                    bg-muted/50 p-1.5 text-[11px]
                                    transition-colors hover:bg-muted"
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
