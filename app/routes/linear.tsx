import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import workerpool from 'workerpool';
import ChevronDownIcon from '~icons/lucide/chevron-down';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import BooleanInput from '~/components/recalc/io/boolean';
import {
  MeasurementDisplayOutput,
  MeasurementInput,
} from '~/components/recalc/io/measurement';
import { MotorInput } from '~/components/recalc/io/motor';
import NumberInput from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
import { ReorderList } from '~/components/recalc/reorderList';
import { Loader } from '~/components/shadix-ui/components/loader';
import { Button } from '~/components/ui/button';
import { ChartContainer } from '~/components/ui/chart';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import {
  calculateLinearFeedforwardKa,
  calculateLinearFeedforwardKg,
  calculateLinearFeedforwardKv,
} from '~/lib/math/kVkA';
import { calculateGuessedLimits, calculateStallLoad } from '~/lib/math/linear';
import type * as LinearWorker from '~/lib/math/linear.worker';
import type {
  ConfigOptOutput,
  OptimizationPriority,
} from '~/lib/math/linearOptimizer.worker';
import optimizerWorkerUrl from '~/lib/math/linearOptimizer.worker?worker&url';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import {
  BooleanParam,
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioParam,
} from '~/lib/types/queryParams';

const CASCADE_TRAVEL_FACTOR = 0.5;
const BATTERY_VOLTAGE_FILTER_TC_S = 0.1;
const DEFAULT_TIER_TOLERANCE_PERCENT = 10;

const PRIORITY_LABELS: Record<OptimizationPriority, string> = {
  timeToGoal: 'Time to Goal',
  peakCurrent: 'Peak Supply Current',
  energy: 'Energy',
  avgPower: 'Avg Power',
};

const DEFAULT_PRIORITIES: OptimizationPriority[] = [
  'timeToGoal',
  'peakCurrent',
  'energy',
  'avgPower',
];

type GridDisplayMode = 'ratio' | 'peakCurrent' | 'energy' | 'avgPower';

const GRID_DISPLAY_MODES: { mode: GridDisplayMode; label: string }[] = [
  { mode: 'ratio', label: 'Ratio' },
  { mode: 'peakCurrent', label: 'Peak I' },
  { mode: 'energy', label: 'Energy' },
  { mode: 'avgPower', label: 'Avg P' },
];

type WpilibElevatorSimState = LinearWorker.WpilibElevatorSimState;

export function meta() {
  return [
    { title: 'Linear Motion Calculator' },
    { name: 'description', content: 'Linear Motion Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  motor: MotorParam.withDefault(Motor.KrakenX60sFOC(1)),
  travelDistance: MeasurementParam.withDefault(new Measurement(60, 'in')),
  spoolDiameter: MeasurementParam.withDefault(new Measurement(1, 'in')),
  load: MeasurementParam.withDefault(new Measurement(15, 'lb')),
  ratio: RatioParam.withDefault(new Ratio(2, RatioType.REDUCTION)),
  efficiency: NumberParam.withDefault(100),
  statorLimit: MeasurementParam.withDefault(new Measurement(80, 'A')),
  supplyLimit: MeasurementParam.withDefault(new Measurement(60, 'A')),
  supplyVoltage: MeasurementParam.withDefault(new Measurement(12, 'V')),
  angle: MeasurementParam.withDefault(new Measurement(90, 'deg')),
  batteryResistance: MeasurementParam.withDefault(
    new Measurement(0.015, 'Ohm'),
  ),
  cascade: BooleanParam.withDefault(false),
  maximumComfortableStatorLimit: MeasurementParam.withDefault(
    new Measurement(80, 'A'),
  ),
  maximumComfortableSupplyLimit: MeasurementParam.withDefault(
    new Measurement(60, 'A'),
  ),
  enableCustomMaxVelocity: BooleanParam.withDefault(false),
  maxVelocity: MeasurementParam.withDefault(new Measurement(2, 'm/s')),
  enableCustomMaxAcceleration: BooleanParam.withDefault(false),
  maxAcceleration: MeasurementParam.withDefault(new Measurement(10, 'm/s^2')),
  qPosition: MeasurementParam.withDefault(new Measurement(0.02, 'm')),
  qVelocity: MeasurementParam.withDefault(new Measurement(0.4, 'm/s')),
  rVolts: MeasurementParam.withDefault(new Measurement(12, 'V')),
  sensorDelay: MeasurementParam.withDefault(new Measurement(0.001, 's')),
};

const worker = new ComlinkWorker<typeof LinearWorker>(
  new URL('../lib/math/linear.worker', import.meta.url),
  {
    type: 'module',
  },
);

const optimizerPool = workerpool.pool(optimizerWorkerUrl, {
  workerType: 'web',
  workerOpts: { type: 'module' },
});
export default function Linear() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [motor, setMotor] = useState(queryParams.motor);
  const [travelDistance, setTravelDistance] = useState(
    queryParams.travelDistance,
  );
  const [spoolDiameter, setSpoolDiameter] = useState(queryParams.spoolDiameter);
  const [load, setLoad] = useState(queryParams.load);
  const [ratio, setRatio] = useState(queryParams.ratio);
  const [efficiency, setEfficiency] = useState(queryParams.efficiency);
  const [statorLimit, setStatorLimit] = useState(queryParams.statorLimit);
  const [supplyLimit, setSupplyLimit] = useState(queryParams.supplyLimit);
  const [supplyVoltage, setSupplyVoltage] = useState(queryParams.supplyVoltage);
  const [angle, setAngle] = useState(queryParams.angle);
  const [batteryResistance, setBatteryResistance] = useState(
    queryParams.batteryResistance,
  );
  const [cascade, setCascade] = useState(queryParams.cascade);
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const [maximumComfortableStatorLimit, setMaximumComfortableStatorLimit] =
    useState(queryParams.maximumComfortableStatorLimit);
  const [maximumComfortableSupplyLimit, setMaximumComfortableSupplyLimit] =
    useState(queryParams.maximumComfortableSupplyLimit);

  const [enableCustomMaxVelocity, setEnableCustomMaxVelocity] = useState(
    queryParams.enableCustomMaxVelocity,
  );
  const [maxVelocity, setMaxVelocity] = useState(queryParams.maxVelocity);

  const [enableCustomMaxAcceleration, setEnableCustomMaxAcceleration] =
    useState(queryParams.enableCustomMaxAcceleration);
  const [maxAcceleration, setMaxAcceleration] = useState(
    queryParams.maxAcceleration,
  );
  const [sensorDelay, setSensorDelay] = useState(queryParams.sensorDelay);

  const [qPosition, setQPosition] = useState(queryParams.qPosition);
  const [qVelocity, setQVelocity] = useState(queryParams.qVelocity);
  const [rVolts, setRVolts] = useState(queryParams.rVolts);

  const { v_max_guessed, a_max_guessed } = useMemo(
    () =>
      calculateGuessedLimits(
        motor,
        ratio,
        load,
        spoolDiameter,
        statorLimit,
        supplyLimit,
        supplyVoltage,
        angle,
        efficiency,
        cascade,
      ),
    [
      motor,
      ratio,
      load,
      spoolDiameter,
      statorLimit,
      supplyLimit,
      supplyVoltage,
      angle,
      efficiency,
      cascade,
    ],
  );

  const effectiveMaxVelocity = useMemo(
    () => (enableCustomMaxVelocity ? maxVelocity : v_max_guessed),
    [enableCustomMaxVelocity, maxVelocity, v_max_guessed],
  );

  const effectiveMaxAcceleration = useMemo(
    () => (enableCustomMaxAcceleration ? maxAcceleration : a_max_guessed),
    [enableCustomMaxAcceleration, maxAcceleration, a_max_guessed],
  );

  const stallLoad = useMemo(() => {
    return calculateStallLoad(
      motor,
      statorLimit,
      spoolDiameter,
      ratio,
      efficiency,
      supplyVoltage,
    );
  }, [motor, statorLimit, spoolDiameter, ratio, efficiency, supplyVoltage]);

  const [priorities, setPriorities] =
    useState<OptimizationPriority[]>(DEFAULT_PRIORITIES);
  const [tierTolerance, setTierTolerance] = useState(
    DEFAULT_TIER_TOLERANCE_PERCENT,
  );
  const [gridDisplayMode, setGridDisplayMode] =
    useState<GridDisplayMode>('ratio');

  const [workerWpilibSimStates, setWorkerWpilibSimStates] = useState<
    WpilibElevatorSimState[]
  >([]);
  const [isSimulating, setIsSimulating] = useState(true);

  const chartData = useMemo(() => {
    const travelUnit = travelDistance.units();
    const velocityUnit = `${travelUnit}/s`;

    return workerWpilibSimStates.map((state) => ({
      ...state,
      positionConverted: new Measurement(state.positionMeters, 'm').to(
        travelUnit,
      ).scalar,
      velocityConverted: new Measurement(
        state.velocityMetersPerSecond,
        'm/s',
      ).to(velocityUnit).scalar,
    }));
  }, [workerWpilibSimStates, travelDistance]);

  const [configOptResult, setConfigOptResult] =
    useState<ConfigOptOutput | null>(null);
  const configOptGeneration = useRef(0);

  const timeToGoal = useMemo(() => {
    return new Measurement(
      workerWpilibSimStates.length > 0
        ? workerWpilibSimStates[workerWpilibSimStates.length - 1].timeSeconds
        : 0,
      's',
    );
  }, [workerWpilibSimStates]);

  const endError = useMemo(() => {
    if (workerWpilibSimStates.length === 0) return new Measurement(0, 'm');
    const lastPos = new Measurement(
      workerWpilibSimStates[workerWpilibSimStates.length - 1].positionMeters,
      'm',
    );
    const targetPos = cascade
      ? travelDistance.mul(CASCADE_TRAVEL_FACTOR)
      : travelDistance;
    return targetPos.sub(lastPos);
  }, [workerWpilibSimStates, travelDistance, cascade]);

  const kA = useMemo(
    () =>
      calculateLinearFeedforwardKa(
        motor,
        ratio,
        spoolDiameter.div(2),
        load,
        efficiency / 100,
      ),
    [motor, ratio, load, spoolDiameter, efficiency],
  );
  const kV = useMemo(
    () =>
      calculateLinearFeedforwardKv(
        motor,
        ratio,
        spoolDiameter.div(2),
        efficiency / 100,
      ),
    [motor, ratio, spoolDiameter, efficiency],
  );
  const kG = useMemo(
    () => calculateLinearFeedforwardKg(kA, angle),
    [kA, angle],
  );

  useEffect(() => {
    setIsSimulating(true);
    worker
      .simulateElevatorWpilib(
        motor.toDict(),
        ratio.toDict(),
        load.toDict(),
        spoolDiameter.toDict(),
        travelDistance.toDict(),
        statorLimit.toDict(),
        supplyLimit.toDict(),
        batteryResistance.toDict(),
        supplyVoltage.toDict(),
        angle.toDict(),
        efficiency / 100,
        cascade,
        BATTERY_VOLTAGE_FILTER_TC_S,
        effectiveMaxVelocity.toDict(),
        effectiveMaxAcceleration.toDict(),
        qPosition.to('m').scalar,
        qVelocity.to('m/s').scalar,
        rVolts.to('V').scalar,
        sensorDelay.to('s').scalar,
      )
      .then((states) => {
        setWorkerWpilibSimStates(states);
        setIsSimulating(false);
      })
      .catch((error) => {
        console.error(error);
        setIsSimulating(false);
      });
  }, [
    motor,
    ratio,
    load,
    spoolDiameter,
    travelDistance,
    statorLimit,
    supplyLimit,
    batteryResistance,
    supplyVoltage,
    angle,
    efficiency,
    cascade,
    effectiveMaxVelocity,
    effectiveMaxAcceleration,
    qPosition,
    qVelocity,
    rVolts,
    sensorDelay,
  ]);

  const userStatorAmps = statorLimit.to('A').scalar;
  const userSupplyAmps = supplyLimit.to('A').scalar;

  useEffect(() => {
    if (!optimizationEnabled) {
      setConfigOptResult(null);
      return;
    }
    const gen = ++configOptGeneration.current;
    setConfigOptResult(null);

    optimizerPool
      .exec('optimizeConfiguration', [
        motor.toDict(),
        load.toDict(),
        spoolDiameter.toDict(),
        travelDistance.toDict(),
        batteryResistance.toDict(),
        supplyVoltage.toDict(),
        maximumComfortableStatorLimit.toDict(),
        maximumComfortableSupplyLimit.toDict(),
        angle.toDict(),
        efficiency / 100,
        cascade,
        BATTERY_VOLTAGE_FILTER_TC_S,
        priorities,
        tierTolerance / 100,
        enableCustomMaxVelocity ? maxVelocity.to('m/s').scalar : null,
        enableCustomMaxAcceleration ? maxAcceleration.to('m/s^2').scalar : null,
        qPosition.to('m').scalar,
        qVelocity.to('m/s').scalar,
        rVolts.to('V').scalar,
        sensorDelay.to('s').scalar,
      ])
      .then((result: ConfigOptOutput) => {
        if (gen !== configOptGeneration.current) return;
        setConfigOptResult(result);
      })
      .catch((err: unknown) => {
        console.error('Config optimizer error:', err);
      });
  }, [
    motor,
    load,
    spoolDiameter,
    travelDistance,
    batteryResistance,
    supplyVoltage,
    maximumComfortableStatorLimit,
    maximumComfortableSupplyLimit,
    angle,
    efficiency,
    cascade,
    optimizationEnabled,
    priorities,
    tierTolerance,
    qPosition,
    qVelocity,
    rVolts,
    enableCustomMaxVelocity,
    enableCustomMaxAcceleration,
    maxVelocity,
    maxAcceleration,
    sensorDelay,
  ]);

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    motor,
    ratio,
    load,
    spoolDiameter,
    travelDistance,
    efficiency,
    statorLimit,
    supplyLimit,
    supplyVoltage,
    angle,
    batteryResistance,
    cascade,
    maximumComfortableStatorLimit,
    maximumComfortableSupplyLimit,
    enableCustomMaxVelocity,
    maxVelocity,
    enableCustomMaxAcceleration,
    maxAcceleration,
    qPosition,
    qVelocity,
    rVolts,
    sensorDelay,
  });

  return (
    <div>
      <div data-testid="linear-main" data-calculating={String(isSimulating)}>
        <CalcHeading
          title="Linear Motion Calculator"
          getSerializedState={() => serializedState}
        />
        <div className="flex flex-row flex-wrap gap-6 px-1">
          {/* Left column: inputs */}
          <div className="flex min-w-[300px] flex-1 flex-col">
            <section className="flex flex-col rounded-lg border">
              {/* Motor & Gearing section */}
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Motor &amp; Gearing
                  </h2>
                  <BooleanInput
                    stateHook={[cascade, setCascade]}
                    label="Cascade"
                    testId="cascade"
                    tooltip="Enable for a cascading elevator. The simulation applies first-stage mechanics: half the travel distance and double the load."
                  />
                </div>
                <IOLine>
                  <MotorInput
                    stateHook={[motor, setMotor]}
                    testId="motor"
                    labelAbove
                  />
                  <NumberInput
                    stateHook={[efficiency, setEfficiency]}
                    label="Efficiency %"
                    tooltip="The efficiency of the motor and gearbox. Typically ~92-97% per stage."
                    testId="efficiency"
                    labelAbove
                  />
                </IOLine>
                <IOLine>
                  <RatioInput
                    stateHook={[ratio, setRatio]}
                    testId="ratio"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[spoolDiameter, setSpoolDiameter]}
                    label="Spool Diameter"
                    tooltip="The diameter of the spool or wheel that the elevator rigging is wrapped around. If a pulley or sprocket, use the pitch diameter."
                    testId="spoolDiameter"
                    labelAbove
                  />
                </IOLine>
              </div>
              <div className="border-t" />

              {/* Load & Travel section */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Load &amp; Travel
                </h2>
                <IOLine>
                  <MeasurementInput
                    stateHook={[load, setLoad]}
                    label="Load"
                    testId="load"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[angle, setAngle]}
                    label="Angle"
                    testId="angle"
                    labelAbove
                  />
                </IOLine>
                <IOLine>
                  <MeasurementInput
                    stateHook={[travelDistance, setTravelDistance]}
                    label="Travel Distance"
                    tooltip="The distance the elevator will travel. This is the distance from the starting position to the end position."
                    testId="travelDistance"
                    labelAbove
                  />
                </IOLine>
              </div>
              <div className="border-t" />

              {/* Limits section */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Limits
                </h2>
                <IOLine>
                  <MeasurementInput
                    stateHook={[statorLimit, setStatorLimit]}
                    label="Stator Limit"
                    tooltip="The current limit applied to the stator."
                    testId="statorLimit"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[supplyLimit, setSupplyLimit]}
                    label="Supply Limit"
                    tooltip="The current limit applied to the supply (battery). This is *not* supported by REVLib, so make sure the supply power limit is higher than the stator power limit for REV motors."
                    testId="supplyLimit"
                    labelAbove
                  />
                </IOLine>
                <IOLine>
                  <MeasurementInput
                    stateHook={[supplyVoltage, setSupplyVoltage]}
                    label="Supply Voltage"
                    tooltip="The voltage available from the supply (battery) at rest."
                    testId="supplyVoltage"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[batteryResistance, setBatteryResistance]}
                    label="Battery Resistance"
                    tooltip="The effective resistance of the battery. Includes wire runs."
                    testId="batteryResistance"
                    labelAbove
                  />
                </IOLine>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Max Velocity</span>
                    <BooleanInput
                      stateHook={[
                        enableCustomMaxVelocity,
                        setEnableCustomMaxVelocity,
                      ]}
                      label="Custom"
                      testId="enableCustomMaxVelocity"
                    />
                  </div>
                  {enableCustomMaxVelocity ? (
                    <MeasurementInput
                      stateHook={[maxVelocity, setMaxVelocity]}
                      label="Custom"
                      tooltip="Maximum trapezoidal profile velocity."
                      testId="maxVelocity"
                    />
                  ) : (
                    <MeasurementDisplayOutput
                      state={effectiveMaxVelocity}
                      label="Guessed"
                      defaultUnit="in/s"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Max Acceleration
                    </span>
                    <BooleanInput
                      stateHook={[
                        enableCustomMaxAcceleration,
                        setEnableCustomMaxAcceleration,
                      ]}
                      label="Custom"
                      testId="enableCustomMaxAcceleration"
                    />
                  </div>
                  {enableCustomMaxAcceleration ? (
                    <MeasurementInput
                      stateHook={[maxAcceleration, setMaxAcceleration]}
                      label="Custom"
                      tooltip="Maximum trapezoidal profile acceleration."
                      testId="maxAcceleration"
                    />
                  ) : (
                    <MeasurementDisplayOutput
                      state={effectiveMaxAcceleration}
                      label="Guessed"
                      defaultUnit="in/s2"
                    />
                  )}
                </div>
              </div>
              <div className="border-t" />

              {/* LQR Tuning section */}
              <Collapsible defaultOpen={false} className="flex flex-col p-4">
                <CollapsibleTrigger className="group flex cursor-pointer items-center gap-1">
                  <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                  <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    LQR Tuning
                  </h2>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <div className="flex flex-col gap-3 pt-3">
                    <IOLine>
                      <MeasurementInput
                        stateHook={[qPosition, setQPosition]}
                        label="Q Position"
                        tooltip="Maximum tolerable position error (Bryson's rule). Smaller values make the controller more aggressive about correcting position error."
                        testId="qPosition"
                        labelAbove
                      />
                      <MeasurementInput
                        stateHook={[qVelocity, setQVelocity]}
                        label="Q Velocity"
                        tooltip="Maximum tolerable velocity error (Bryson's rule). Smaller values make the controller more aggressive about correcting velocity error."
                        testId="qVelocity"
                        labelAbove
                      />
                    </IOLine>
                    <IOLine>
                      <MeasurementInput
                        stateHook={[rVolts, setRVolts]}
                        label="R (Volts)"
                        tooltip="Maximum tolerable control effort in volts (Bryson's rule). Larger values reduce aggressiveness and limit output voltage."
                        testId="rVolts"
                        labelAbove
                      />
                      <MeasurementInput
                        stateHook={[sensorDelay, setSensorDelay]}
                        label="Sensor Delay"
                        tooltip="The delay time for the sensor. This is used to compensate for the sensor delay."
                        testId="sensorDelay"
                        labelAbove
                      />
                    </IOLine>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </section>
          </div>

          {/* Right column: outputs + chart */}
          <div className="flex min-w-[300px] flex-1 flex-col gap-4">
            {/* Results + Chart + Feedforward as one card */}
            <section className="flex flex-col rounded-lg border">
              <div className="grid grid-cols-3 gap-2 p-4">
                {isSimulating ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </>
                ) : (
                  <>
                    <MeasurementDisplayOutput
                      state={timeToGoal}
                      label="Time to Goal"
                      defaultUnit="s"
                      testId="timeToGoal"
                    />
                    <MeasurementDisplayOutput
                      state={stallLoad}
                      label="Stall Load"
                      defaultUnit="lbs"
                      testId="stallLoad"
                    />
                    <MeasurementDisplayOutput
                      state={endError}
                      label="End Error"
                      defaultUnit="in"
                      testId="endError"
                    />
                  </>
                )}
              </div>
              <div className="border-t" />
              <div className="p-4 pb-2">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Simulation
                </h2>
                {isSimulating ? (
                  <Skeleton className="min-h-[200px] w-full rounded-md" />
                ) : (
                  <ChartContainer config={{}} className="min-h-[200px] w-full">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 20, bottom: 30, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timeSeconds"
                        tickFormatter={(v: number) =>
                          parseFloat(v.toPrecision(3)).toString()
                        }
                        label={{
                          value: 'Time (s)',
                          position: 'insideBottom',
                          offset: -15,
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        label={{
                          value: `Velocity (${travelDistance.units()}/s) / Current (A)`,
                          angle: -90,
                          position: 'insideLeft',
                          offset: 15,
                          style: { textAnchor: 'middle' },
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{
                          value: `Position (${travelDistance.units()})`,
                          angle: 90,
                          position: 'insideRight',
                          offset: 15,
                          style: { textAnchor: 'middle' },
                        }}
                      />
                      <Tooltip />
                      <Legend verticalAlign="top" />
                      <Line
                        name={`Position (${travelDistance.units()})`}
                        dataKey="positionConverted"
                        yAxisId="right"
                        stroke="black"
                        dot={false}
                      />
                      <Line
                        name={`Velocity (${travelDistance.units()}/s)`}
                        dataKey="velocityConverted"
                        yAxisId="left"
                        stroke="red"
                        dot={false}
                      />
                      <Line
                        name="Stator Current (A)"
                        dataKey="statorCurrentDrawAmps"
                        yAxisId="left"
                        stroke="goldenrod"
                        dot={false}
                      />
                      <Line
                        name="Supply Current (A)"
                        dataKey="supplyCurrentDrawAmps"
                        yAxisId="left"
                        stroke="purple"
                        dot={false}
                      />
                      <Line
                        name="Motor Applied Voltage (V)"
                        dataKey="motorAppliedVoltageVolts"
                        yAxisId="left"
                        stroke="blue"
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </div>

              <div className="border-t" />
              <div className="grid grid-cols-3 gap-2 p-4">
                <MeasurementDisplayOutput
                  state={kA}
                  label="kA"
                  defaultUnit="V*s^2/m"
                  roundTo={3}
                  testId="kA"
                />
                <MeasurementDisplayOutput
                  state={kV}
                  label="kV"
                  defaultUnit="V*s/m"
                  roundTo={3}
                  testId="kV"
                />
                <MeasurementDisplayOutput
                  state={kG}
                  label="kG"
                  defaultUnit="V"
                  roundTo={3}
                  testId="kG"
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Mechanism Optimization divider + toggle */}
      <div className="my-6 flex items-center gap-4 px-1">
        <div className="flex-1 border-t" />
        <BooleanInput
          stateHook={[optimizationEnabled, setOptimizationEnabled]}
          label="Mechanism Optimization"
          testId="optimizationEnabled"
        />
        <div className="flex-1 border-t" />
      </div>

      {optimizationEnabled && (
        <div className="flex flex-col gap-4 px-1">
          {/* Row 1: Optimal configuration grid + priority reorder list + settings */}
          <div className="flex flex-row flex-wrap gap-4">
            {/* Optimal configuration grid */}
            <section className="flex min-w-0 flex-1 flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <h2 className="flex-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Optimal Configuration Grid
                </h2>
                <div className="flex gap-1">
                  {GRID_DISPLAY_MODES.map(({ mode, label }) => (
                    <Button
                      key={mode}
                      size="sm"
                      variant={gridDisplayMode === mode ? 'default' : 'ghost'}
                      className="h-6 px-2 text-xs"
                      onClick={() => setGridDisplayMode(mode)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              {configOptResult ? (
                (() => {
                  if (!configOptResult.recommended) {
                    return (
                      <p className="text-sm text-muted-foreground">
                        No successful configurations found. Try adjusting your
                        inputs.
                      </p>
                    );
                  }
                  const statorLimits = [
                    ...new Set(
                      configOptResult.allResults.map((r) => r.statorLimitAmps),
                    ),
                  ].sort((a, b) => a - b);
                  const supplyLimits = [
                    ...new Set(
                      configOptResult.allResults.map((r) => r.supplyLimitAmps),
                    ),
                  ].sort((a, b) => a - b);
                  const cellMap = new Map(
                    configOptResult.allResults.map((r) => [
                      `${r.statorLimitAmps}-${r.supplyLimitAmps}`,
                      r,
                    ]),
                  );
                  const rec = configOptResult.recommended;

                  const formatCell = (
                    cell: import('~/lib/math/linearOptimizer.worker').ConfigOptResult,
                  ) => {
                    switch (gridDisplayMode) {
                      case 'ratio':
                        return cell.optimalRatio.toFixed(2);
                      case 'peakCurrent':
                        return `${cell.peakCurrentAmps.toFixed(1)} A`;
                      case 'energy':
                        return `${cell.energyJoules.toFixed(1)} J`;
                      case 'avgPower':
                        return `${(cell.energyJoules / cell.timeToGoalSeconds).toFixed(1)} W`;
                    }
                  };

                  return (
                    <div className="overflow-x-auto">
                      <table className="border-separate border-spacing-0 text-xs tabular-nums">
                        <thead>
                          <tr>
                            <th className="pr-2 pb-1 text-left font-medium whitespace-nowrap text-muted-foreground">
                              Stator \ Supply
                            </th>
                            {supplyLimits.map((s) => (
                              <th
                                key={s}
                                className={`w-20 px-2 pb-1 text-center font-medium whitespace-nowrap ${s === userSupplyAmps ? 'text-foreground' : 'text-muted-foreground'}`}
                              >
                                {s} A
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {statorLimits.map((stator) => (
                            <tr key={stator}>
                              <td
                                className={`py-0.5 pr-2 font-medium whitespace-nowrap ${stator === userStatorAmps ? 'text-foreground' : 'text-muted-foreground'}`}
                              >
                                {stator} A
                              </td>
                              {supplyLimits.map((supply) => {
                                const cell = cellMap.get(`${stator}-${supply}`);
                                const isRecommended =
                                  rec.statorLimitAmps === stator &&
                                  rec.supplyLimitAmps === supply;
                                return (
                                  <td
                                    key={supply}
                                    className="w-20 px-2 py-0.5 text-center whitespace-nowrap tabular-nums"
                                  >
                                    {cell?.success ? (
                                      <UiTooltip>
                                        <TooltipTrigger asChild>
                                          <span
                                            className={`inline-block cursor-default rounded px-1 py-0.5 ${
                                              isRecommended
                                                ? 'bg-primary font-semibold text-primary-foreground'
                                                : 'hover:bg-muted'
                                            }`}
                                          >
                                            {formatCell(cell)}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="flex flex-col gap-1 text-xs">
                                          <div>
                                            <span className="text-primary-foreground/70">
                                              Ratio:{' '}
                                            </span>
                                            {cell.optimalRatio.toFixed(2)}
                                          </div>
                                          <div>
                                            <span className="text-primary-foreground/70">
                                              Time:{' '}
                                            </span>
                                            {cell.timeToGoalSeconds.toFixed(3)}{' '}
                                            s
                                          </div>
                                          <div>
                                            <span className="text-primary-foreground/70">
                                              Peak Supply:{' '}
                                            </span>
                                            {cell.peakCurrentAmps.toFixed(1)} A
                                          </div>
                                          <div>
                                            <span className="text-primary-foreground/70">
                                              Energy:{' '}
                                            </span>
                                            {cell.energyJoules.toFixed(1)} J
                                          </div>
                                          <div>
                                            <span className="text-primary-foreground/70">
                                              Avg Power:{' '}
                                            </span>
                                            {(
                                              cell.energyJoules /
                                              cell.timeToGoalSeconds
                                            ).toFixed(1)}{' '}
                                            W
                                          </div>
                                        </TooltipContent>
                                      </UiTooltip>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              ) : (
                <div className="text-sm text-muted-foreground">
                  <Loader variant="bar" />
                </div>
              )}
            </section>

            {/* Priority reorder list */}
            <section className="flex w-64 shrink-0 flex-col gap-3 rounded-lg border p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Priority Tiers
              </h2>
              <ReorderList
                withDragHandle
                onReorderFinish={(newOrder) => {
                  const newPriorities = newOrder
                    .map((el) => el.key)
                    .filter((k): k is OptimizationPriority => k !== null);
                  setPriorities(newPriorities);
                }}
              >
                {priorities.map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 rounded border px-3 py-2 text-sm"
                  >
                    {PRIORITY_LABELS[p]}
                  </div>
                ))}
              </ReorderList>
            </section>

            {/* Optimization settings */}
            <section className="flex w-64 shrink-0 flex-col gap-3 rounded-lg border p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Settings
              </h2>
              <NumberInput
                label="Tier tolerance"
                tooltip="How much worse than the best a candidate can be before it's excluded from the next priority tier. Default 10%."
                stateHook={[tierTolerance, setTierTolerance]}
              />
              <MeasurementInput
                stateHook={[
                  maximumComfortableStatorLimit,
                  setMaximumComfortableStatorLimit,
                ]}
                label="Max Stator Limit"
                tooltip="The maximum stator limit that is comfortable for you. Used for recommendations."
                testId="maximumComfortableStatorLimit"
                labelAbove
              />
              <MeasurementInput
                stateHook={[
                  maximumComfortableSupplyLimit,
                  setMaximumComfortableSupplyLimit,
                ]}
                label="Max Supply Limit"
                tooltip="The maximum supply limit that is comfortable for you. Used for recommendations."
                testId="maximumComfortableSupplyLimit"
                labelAbove
              />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
