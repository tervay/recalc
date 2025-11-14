import { useEffect, useMemo, useState } from 'react';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import Divider from '~/components/recalc/divider';
import BooleanInput from '~/components/recalc/io/boolean';
import NumberInput from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
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
    { title: 'Ratio Finder Calculator' },
    { name: 'description', content: 'Ratio Finder Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  minGearTeeth: withDefault(NumberParam, 6),
  maxGearTeeth: withDefault(NumberParam, 100),
  minPulleyTeeth: withDefault(NumberParam, 8),
  maxPulleyTeeth: withDefault(NumberParam, 84),
  minSprocketTeeth: withDefault(NumberParam, 8),
  maxSprocketTeeth: withDefault(NumberParam, 84),
  enableREV: withDefault(BooleanParam, true),
  enableWCP: withDefault(BooleanParam, true),
  enableAM: withDefault(BooleanParam, true),
  enableTTB: withDefault(BooleanParam, true),
  enable20DP: withDefault(BooleanParam, true),
  enable32DP: withDefault(BooleanParam, true),
  enableGT2: withDefault(BooleanParam, true),
  enableHTD: withDefault(BooleanParam, true),
  enableRT25: withDefault(BooleanParam, true),
  enable25Chain: withDefault(BooleanParam, true),
  enable35Chain: withDefault(BooleanParam, true),
  enableBore12Hex: withDefault(BooleanParam, true),
  enableBore38Hex: withDefault(BooleanParam, true),
  enableBore1125: withDefault(BooleanParam, true),
  enableBoreMAXSpline: withDefault(BooleanParam, true),
  enableBoreSplineXL: withDefault(BooleanParam, true),
  targetReduction: withDefault(RatioParam, new Ratio(12, RatioType.REDUCTION)),
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
    worker
      .findGearboxes(
        targetReduction.toDict(),
        targetReductionErrorThreshold,
        startingBore,
        filters,
      )
      .then((results) => {
        console.log(results);
        setSolutions(results);
      })
      .catch((error) => {
        console.error(error);
        setSolutions([]);
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
    targetReduction,
    targetReductionErrorThreshold,
    enablePrintedPulleys,
  });

  return (
    <div>
      <CalcHeading
        title="Ratio Finder Calculator"
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
          </IOLine>

          <Divider>Other</Divider>
          <IOLine>
            <BooleanInput
              stateHook={[enablePrintedPulleys, setEnablePrintedPulleys]}
              label="Enable Printed Pulleys"
            />
          </IOLine>
        </div>

        <div className="flex flex-col gap-x-4 gap-y-2">
          <Divider>Results</Divider>
          {solutions.length === 0 ? (
            <div className="text-muted-foreground">No solutions found</div>
          ) : (
            <div className="flex flex-col gap-4">
              {solutions.map((solution, index) => (
                <SolutionCard key={index} solution={solution} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SolutionCardProps {
  solution: RatioFinderWorker.GearboxSolution;
}

function SolutionCard({ solution }: SolutionCardProps) {
  return (
    <div>
      {solution.ratio.toFixed(4)}
      {solution.stages.map((stage, index) => (
        <div key={index}>
          {stage.from.teeth}t → {stage.to.teeth}t
          <p>{stage.from.skus.join(', ')}</p>
          <p>{stage.to.skus.join(', ')}</p>
        </div>
      ))}
    </div>
    // <div className="rounded-md border p-4">
    //   <div className="mb-2 flex items-center justify-between">
    //     <div className="font-semibold">
    //       {solution.stages.length} Stage
    //       {solution.stages.length !== 1 ? 's' : ''}
    //     </div>
    //     <div className="text-sm">Ratio: {solution.ratio.toFixed(4)}</div>
    //   </div>
    //   <div className="space-y-2">
    //     {solution.stages.map((stage, index) => (
    //       <div key={index} className="text-sm">
    //         <div className="font-medium">
    //           Stage {index + 1}: {stage.from.teeth}t → {stage.to.teeth}t (Ratio:{' '}
    //           {stage.ratio.toFixed(4)})
    //         </div>
    //         <div className="ml-4 text-muted-foreground">
    //           {stage.from.family} ({stage.from.vendor}
    //           {stage.from.profile ? `, ${stage.from.profile}` : ''}
    //           {stage.from.chainType ? `, ${stage.from.chainType}` : ''},{' '}
    //           {stage.from.bore}) → {stage.to.family} ({stage.to.vendor}
    //           {stage.to.profile ? `, ${stage.to.profile}` : ''}
    //           {stage.to.chainType ? `, ${stage.to.chainType}` : ''},{' '}
    //           {stage.to.bore})
    //         </div>
    //       </div>
    //     ))}
    //   </div>
    // </div>
  );
}
