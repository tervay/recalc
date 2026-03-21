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
import { ChartContainer } from '~/components/ui/chart';
import { Skeleton } from '~/components/ui/skeleton';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { calculateKa, calculateKg, calculateKv } from '~/lib/math/kVkA';
import { calculateStallLoad } from '~/lib/math/linear';
import type * as LinearWorker from '~/lib/math/linear.worker';
import type {
  ConfigOptOutput,
  OptimizerResult,
  SingleSimResult,
} from '~/lib/math/linearOptimizer.worker';
import optimizerWorkerUrl from '~/lib/math/linearOptimizer.worker?worker&url';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { MotorRules } from '~/lib/rules';
import {
  BooleanParam,
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioParam,
} from '~/lib/types/queryParams';

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
  statorLimit: MeasurementParam.withDefault(new Measurement(60, 'A')),
  supplyLimit: MeasurementParam.withDefault(new Measurement(90, 'A')),
  supplyVoltage: MeasurementParam.withDefault(new Measurement(12, 'V')),
  statorVoltage: MeasurementParam.withDefault(new Measurement(12, 'V')),
  angle: MeasurementParam.withDefault(new Measurement(90, 'deg')),
  batteryResistance: MeasurementParam.withDefault(
    new Measurement(0.015, 'Ohm'),
  ),
  cascade: BooleanParam.withDefault(false),
  targetTimeToGoal: MeasurementParam.withDefault(new Measurement(0.5, 's')),
  maximumComfortableStatorLimit: MeasurementParam.withDefault(
    new Measurement(100, 'A'),
  ),
  maximumComfortableSupplyLimit: MeasurementParam.withDefault(
    new Measurement(85, 'A'),
  ),
};

const worker = new ComlinkWorker<typeof LinearWorker>(
  new URL('../lib/math/linear.worker', import.meta.url),
  {
    type: 'module',
  },
);

const OPTIMIZER_STATOR_LIMITS = [20, 30, 40, 50, 60, 70, 80];
const PRESET_SUPPLY_LIMITS = [20, 30, 40, 50, 60, 70];

const optimizerPool = workerpool.pool(optimizerWorkerUrl, {
  workerType: 'web',
  workerOpts: { type: 'module' },
  maxWorkers: 4,
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
  const [statorVoltage, setStatorVoltage] = useState(queryParams.statorVoltage);
  const [angle, setAngle] = useState(queryParams.angle);
  const [batteryResistance, setBatteryResistance] = useState(
    queryParams.batteryResistance,
  );
  const [cascade, setCascade] = useState(queryParams.cascade);
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const [targetTimeToGoal, setTargetTimeToGoal] = useState(
    queryParams.targetTimeToGoal,
  );
  const [maximumComfortableStatorLimit, setMaximumComfortableStatorLimit] =
    useState(queryParams.maximumComfortableStatorLimit);
  const [maximumComfortableSupplyLimit, setMaximumComfortableSupplyLimit] =
    useState(queryParams.maximumComfortableSupplyLimit);

  const kV = useMemo(
    () =>
      ratio.asNumber() === 0
        ? new Measurement(0, 'V*s/m')
        : calculateKv(
            motor.freeSpeed.div(ratio.asNumber()),
            spoolDiameter.div(2),
          ),
    [motor, ratio, spoolDiameter],
  );

  const kA = useMemo(
    () =>
      calculateKa(
        motor.kT
          .mul(statorLimit)
          .mul(motor.quantity)
          .mul(ratio.asNumber())
          .mul(efficiency / 100),
        spoolDiameter.div(2),
        load,
      ),
    [
      motor.kT,
      statorLimit,
      motor.quantity,
      efficiency,
      ratio,
      spoolDiameter,
      load,
    ],
  );

  const kG = useMemo(
    () =>
      calculateKg(
        new MotorRules(motor, statorLimit, {
          current: statorLimit,
          voltage: statorVoltage,
        })
          .solve()
          .torque.mul(motor.quantity)
          .mul(ratio.asNumber())
          .mul(efficiency / 100),
        spoolDiameter.div(2),
        load,
      ).mul(Math.sin(angle.to('rad').scalar)),
    [
      motor,
      statorLimit,
      statorVoltage,
      ratio,
      efficiency,
      spoolDiameter,
      load,
      angle,
    ],
  );

  const stallLoad = useMemo(() => {
    return calculateStallLoad(
      motor,
      statorLimit,
      spoolDiameter,
      ratio,
      efficiency,
      statorVoltage,
    );
  }, [motor, statorLimit, spoolDiameter, ratio, efficiency, statorVoltage]);

  const [workerWpilibSimStates, setWorkerWpilibSimStates] = useState<
    WpilibElevatorSimState[]
  >([]);
  const [isSimulating, setIsSimulating] = useState(true);

  const [optimizerResults, setOptimizerResults] = useState<OptimizerResult[]>(
    [],
  );
  const optimizerGeneration = useRef(0);

  const [supplySimResults, setSupplySimResults] = useState<SingleSimResult[]>(
    [],
  );
  const supplySimGeneration = useRef(0);

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
        statorVoltage.toDict(),
        batteryResistance.toDict(),
        supplyVoltage.toDict(),
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
    statorVoltage,
    batteryResistance,
    supplyVoltage,
  ]);

  const userStatorAmps = statorLimit.to('A').scalar;
  const allStatorLimits = useMemo(
    () =>
      OPTIMIZER_STATOR_LIMITS.includes(userStatorAmps)
        ? OPTIMIZER_STATOR_LIMITS
        : [...OPTIMIZER_STATOR_LIMITS, userStatorAmps].sort((a, b) => a - b),
    [userStatorAmps],
  );

  useEffect(() => {
    if (!optimizationEnabled) {
      setOptimizerResults([]);
      return;
    }
    const gen = ++optimizerGeneration.current;
    setOptimizerResults([]);

    for (const statorLimitAmps of allStatorLimits) {
      optimizerPool
        .exec('optimizeRatio', [
          motor.toDict(),
          load.toDict(),
          spoolDiameter.toDict(),
          travelDistance.toDict(),
          supplyLimit.toDict(),
          statorVoltage.toDict(),
          batteryResistance.toDict(),
          supplyVoltage.toDict(),
          statorLimitAmps,
          ratio.magnitude,
        ])
        .then((result: OptimizerResult) => {
          if (gen !== optimizerGeneration.current) return;
          setOptimizerResults((prev) =>
            [...prev, result].sort(
              (a, b) => a.statorLimitAmps - b.statorLimitAmps,
            ),
          );
        })
        .catch((err: unknown) => {
          console.error('Optimizer error:', err);
        });
    }
  }, [
    motor,
    statorLimit,
    supplyLimit,
    load,
    spoolDiameter,
    travelDistance,
    statorVoltage,
    batteryResistance,
    supplyVoltage,
    ratio,
    optimizationEnabled,
    allStatorLimits,
  ]);

  const userSupplyAmps = supplyLimit.to('A').scalar;
  const allSupplyLimits = useMemo(
    () =>
      PRESET_SUPPLY_LIMITS.includes(userSupplyAmps)
        ? PRESET_SUPPLY_LIMITS
        : [...PRESET_SUPPLY_LIMITS, userSupplyAmps].sort((a, b) => a - b),
    [userSupplyAmps],
  );

  useEffect(() => {
    if (!optimizationEnabled) {
      setSupplySimResults([]);
      return;
    }
    const gen = ++supplySimGeneration.current;
    setSupplySimResults([]);

    for (const s of allSupplyLimits) {
      optimizerPool
        .exec('simulateOnce', [
          motor.toDict(),
          ratio.magnitude,
          load.toDict(),
          spoolDiameter.toDict(),
          travelDistance.toDict(),
          statorLimit.to('A').scalar,
          s,
          statorVoltage.toDict(),
          batteryResistance.toDict(),
          supplyVoltage.toDict(),
        ])
        .then((result: SingleSimResult) => {
          if (gen !== supplySimGeneration.current) return;
          setSupplySimResults((prev) =>
            [...prev, result].sort(
              (a, b) => a.supplyLimitAmps - b.supplyLimitAmps,
            ),
          );
        })
        .catch((err: unknown) => {
          console.error('Supply sim error:', err);
        });
    }
  }, [
    motor,
    ratio,
    load,
    spoolDiameter,
    travelDistance,
    statorLimit,
    supplyLimit,
    statorVoltage,
    batteryResistance,
    supplyVoltage,
    optimizationEnabled,
    allSupplyLimits,
  ]);

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
        statorVoltage.toDict(),
        batteryResistance.toDict(),
        supplyVoltage.toDict(),
        targetTimeToGoal.to('s').scalar,
        maximumComfortableStatorLimit.toDict(),
        maximumComfortableSupplyLimit.toDict(),
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
    statorVoltage,
    batteryResistance,
    supplyVoltage,
    targetTimeToGoal,
    maximumComfortableStatorLimit,
    maximumComfortableSupplyLimit,
    optimizationEnabled,
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
    statorVoltage,
    angle,
    batteryResistance,
    cascade,
    targetTimeToGoal,
    maximumComfortableStatorLimit,
    maximumComfortableSupplyLimit,
  });

  return (
    <div>
      <div data-testid="linear-main">
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
                  <MeasurementInput
                    stateHook={[batteryResistance, setBatteryResistance]}
                    label="Battery Resistance"
                    tooltip="The effective resistance of the battery. Includes wire runs."
                    testId="batteryResistance"
                    labelAbove
                  />
                </IOLine>
                <IOLine>
                  <MeasurementInput
                    stateHook={[targetTimeToGoal, setTargetTimeToGoal]}
                    label="Target Time to Goal"
                    tooltip="The target time to reach the goal position. This is used to optimize the ratio and supply limit."
                    testId="targetTimeToGoal"
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
                    stateHook={[statorVoltage, setStatorVoltage]}
                    label="Stator Voltage"
                    tooltip="The voltage applied to the stator."
                    testId="statorVoltage"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[supplyVoltage, setSupplyVoltage]}
                    label="Supply Voltage"
                    tooltip="The voltage available from the supply (battery) at rest."
                    testId="supplyVoltage"
                    labelAbove
                  />
                </IOLine>
                <IOLine>
                  <MeasurementInput
                    stateHook={[
                      maximumComfortableStatorLimit,
                      setMaximumComfortableStatorLimit,
                    ]}
                    label="Maximum Comfortable Stator Limit"
                    tooltip="The maximum stator limit that is comfortable for you. Used for recommendations."
                    testId="maximumComfortableStatorLimit"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[
                      maximumComfortableSupplyLimit,
                      setMaximumComfortableSupplyLimit,
                    ]}
                    label="Maximum Comfortable Supply Limit"
                    tooltip="The maximum supply limit that is comfortable for you. Used for recommendations."
                    testId="maximumComfortableSupplyLimit"
                    labelAbove
                  />
                </IOLine>
              </div>
            </section>
          </div>

          {/* Right column: outputs + chart */}
          <div className="flex min-w-[300px] flex-1 flex-col gap-4">
            {/* Results + Chart + Feedforward as one card */}
            <section className="flex flex-col rounded-lg border">
              <div className="grid grid-cols-2 gap-2 p-4">
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
                      data={workerWpilibSimStates}
                      margin={{ top: 5, right: 20, bottom: 30, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timeSeconds"
                        label={{
                          value: 'Time (s)',
                          position: 'insideBottom',
                          offset: -15,
                        }}
                      />
                      <YAxis
                        yAxisId="left"
                        label={{
                          value: 'Velocity (m/s) / Current (A)',
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
                          value: 'Position (m)',
                          angle: 90,
                          position: 'insideRight',
                          offset: 15,
                          style: { textAnchor: 'middle' },
                        }}
                      />
                      <Tooltip />
                      <Legend verticalAlign="top" />
                      <Line
                        name="Position (m)"
                        dataKey="positionMeters"
                        yAxisId="right"
                        stroke="black"
                        dot={false}
                      />
                      <Line
                        name="Velocity (m/s)"
                        dataKey="velocityMetersPerSecond"
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
                    </LineChart>
                  </ChartContainer>
                )}
              </div>
              <div className="border-t" />
              <div className="grid grid-cols-3 gap-2 p-4">
                {isSimulating ? (
                  <>
                    {[16, 14, 20].map((w) => (
                      <div key={w} className="flex flex-col gap-1.5">
                        <Skeleton className="h-3 w-6" />
                        <Skeleton className={`h-6 w-${w}`} />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <MeasurementDisplayOutput
                      state={kV}
                      label="kV"
                      defaultUnit="V*s/m"
                      testId="kV"
                    />
                    <MeasurementDisplayOutput
                      state={kA}
                      label="kA"
                      defaultUnit="V*s^2/m"
                      testId="kA"
                    />
                    <MeasurementDisplayOutput
                      state={kG}
                      label="kG"
                      defaultUnit="V"
                      testId="kG"
                    />
                  </>
                )}
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
        <div className="flex flex-row flex-wrap gap-6 px-1">
          {/* Left column: Recommended Configuration */}
          <div className="flex min-w-[300px] flex-1 flex-col gap-4">
            <section className="flex flex-col gap-3 rounded-lg border p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Recommended Configuration
              </h2>
              {configOptResult ? (
                <>
                  {(() => {
                    const ConfigCard = ({
                      result,
                      label,
                      note,
                    }: {
                      result: import('~/lib/math/linearOptimizer.worker').ConfigOptResult;
                      label: string;
                      note: string;
                    }) => (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xs font-medium text-muted-foreground">
                          {label}
                        </h3>
                        <div className="grid grid-cols-3 gap-3 tabular-nums">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Ratio
                            </span>
                            <span className="text-lg font-bold">
                              {result.optimalRatio.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Stator Limit
                            </span>
                            <span className="text-lg font-bold">
                              {result.statorLimitAmps} A
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Supply Limit
                            </span>
                            <span className="text-lg font-bold">
                              {result.supplyLimitAmps} A
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Time to Goal
                            </span>
                            <span className="text-lg font-bold">
                              {result.timeToGoalSeconds.toFixed(3)} s
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Peak Supply Current
                            </span>
                            <span className="text-lg font-bold">
                              {result.peakCurrentAmps.toFixed(1)} A
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Energy
                            </span>
                            <span className="text-lg font-bold">
                              {result.energyJoules.toFixed(1)} J
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{note}</p>
                      </div>
                    );
                    return (
                      <>
                        <ConfigCard
                          result={configOptResult.recommended}
                          label="Fastest overall"
                          note={`${configOptResult.tier1Count} configuration${configOptResult.tier1Count !== 1 ? 's' : ''} within 10% of fastest; ${configOptResult.tier2Count} also within 10% of lowest peak current.`}
                        />
                        <div className="border-t" />
                        {configOptResult.targetResult ? (
                          <ConfigCard
                            result={configOptResult.targetResult}
                            label={`Meets ${targetTimeToGoal.to('s').scalar.toFixed(2)} s target`}
                            note="Lowest peak current among configs that meet the target time, then lowest energy."
                          />
                        ) : (
                          <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-medium text-muted-foreground">
                              Meets {targetTimeToGoal.to('s').scalar.toFixed(2)}{' '}
                              s target
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              No configuration achieves this target time.
                              Fastest achievable:{' '}
                              {configOptResult.recommended.timeToGoalSeconds.toFixed(
                                3,
                              )}{' '}
                              s.
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Optimizing…</div>
              )}
            </section>
          </div>

          {/* Right column: Optimizer tables */}
          <div className="flex min-w-[300px] flex-1 flex-col">
            <section className="flex flex-col rounded-lg border">
              {/* Ratio Optimizer */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Ratio Optimizer
                </h2>
                <table className="w-full text-sm tabular-nums">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pr-3 pb-1 font-medium">
                        Per-Motor
                        <br />
                        Stator Limit
                      </th>
                      <th className="pr-3 pb-1 font-medium">Ratio</th>
                      <th className="pr-3 pb-1 font-medium">
                        Peak Supply
                        <br />
                        Current
                      </th>
                      <th className="pr-3 pb-1 font-medium">Time to Goal</th>
                      <th className="pr-3 pb-1 font-medium">Energy</th>
                      <th className="pb-1 font-medium">Avg Power</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStatorLimits.flatMap((statorLimitAmps) => {
                      const result = optimizerResults.find(
                        (r) => r.statorLimitAmps === statorLimitAmps,
                      );
                      const isUserRow = statorLimitAmps === userStatorAmps;
                      const baselineSeconds = timeToGoal.to('s').scalar;
                      const hasBaseline =
                        workerWpilibSimStates.length > 0 && baselineSeconds > 0;

                      const pctSpan = (pct: number) => (
                        <span
                          className={`ml-1.5 text-xs ${pct < 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {pct > 0 ? '+' : ''}
                          {pct.toFixed(1)}%
                        </span>
                      );

                      const baselineEnergyJoules =
                        workerWpilibSimStates.length > 0
                          ? workerWpilibSimStates[
                              workerWpilibSimStates.length - 1
                            ].energyJoules
                          : null;
                      const baselineAvgPower =
                        baselineEnergyJoules !== null && hasBaseline
                          ? baselineEnergyJoules / baselineSeconds
                          : null;
                      const baselinePeakCurrent =
                        workerWpilibSimStates.length > 0
                          ? Math.max(
                              ...workerWpilibSimStates.map(
                                (s) => s.supplyCurrentDrawAmps,
                              ),
                            )
                          : null;

                      const timePct =
                        result && hasBaseline
                          ? ((result.timeToGoalSeconds - baselineSeconds) /
                              baselineSeconds) *
                            100
                          : null;
                      const peakCurrentPct =
                        result && baselinePeakCurrent !== null
                          ? ((result.peakCurrentAmps - baselinePeakCurrent) /
                              baselinePeakCurrent) *
                            100
                          : null;
                      const energyPct =
                        result && baselineEnergyJoules !== null
                          ? ((result.energyJoules - baselineEnergyJoules) /
                              baselineEnergyJoules) *
                            100
                          : null;
                      const avgPowerPct =
                        result && baselineAvgPower !== null
                          ? ((result.energyJoules / result.timeToGoalSeconds -
                              baselineAvgPower) /
                              baselineAvgPower) *
                            100
                          : null;

                      return [
                        <tr
                          key={statorLimitAmps}
                          className={`border-b last:border-0 ${isUserRow ? 'bg-muted' : ''}`}
                        >
                          <td className="py-1 pr-3">{statorLimitAmps} A</td>
                          <td className="py-1 pr-3">
                            {result ? (
                              result.optimalRatio.toFixed(2)
                            ) : (
                              <Skeleton className="inline-block h-3.5 w-10" />
                            )}
                          </td>
                          <td className="py-1 pr-3">
                            {result ? (
                              <>
                                <span>
                                  {result.peakCurrentAmps.toFixed(1)} A
                                </span>
                                {peakCurrentPct !== null &&
                                  pctSpan(peakCurrentPct)}
                              </>
                            ) : (
                              <Skeleton className="inline-block h-3.5 w-14" />
                            )}
                          </td>
                          <td className="py-1 pr-3">
                            {result ? (
                              <>
                                <span>
                                  {result.timeToGoalSeconds.toFixed(3)} s
                                </span>
                                {timePct !== null && pctSpan(timePct)}
                              </>
                            ) : (
                              <Skeleton className="inline-block h-3.5 w-14" />
                            )}
                          </td>
                          <td className="py-1 pr-3">
                            {result ? (
                              <>
                                <span>{result.energyJoules.toFixed(1)} J</span>
                                {energyPct !== null && pctSpan(energyPct)}
                              </>
                            ) : (
                              <Skeleton className="inline-block h-3.5 w-14" />
                            )}
                          </td>
                          <td className="py-1">
                            {result ? (
                              <>
                                <span>
                                  {(
                                    result.energyJoules /
                                    result.timeToGoalSeconds
                                  ).toFixed(1)}{' '}
                                  W
                                </span>
                                {avgPowerPct !== null && pctSpan(avgPowerPct)}
                              </>
                            ) : (
                              <Skeleton className="inline-block h-3.5 w-14" />
                            )}
                          </td>
                        </tr>,
                      ];
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t" />

              {/* Supply Limit Comparison */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Supply Limit Comparison @ {ratio.toString()}
                </h2>
                <table className="w-full text-sm tabular-nums">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pr-3 pb-1 font-medium">Supply Limit</th>
                      <th className="pr-3 pb-1 font-medium">
                        Peak Supply
                        <br />
                        Current
                      </th>
                      <th className="pr-3 pb-1 font-medium">Time to Goal</th>
                      <th className="pr-3 pb-1 font-medium">Energy</th>
                      <th className="pb-1 font-medium">Avg Power</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSupplyLimits.map((s) => {
                      const result = supplySimResults.find(
                        (res) => res.supplyLimitAmps === s,
                      );
                      const isUserRow = s === userSupplyAmps;
                      const baselineSeconds = timeToGoal.to('s').scalar;
                      const hasBaseline =
                        workerWpilibSimStates.length > 0 && baselineSeconds > 0;
                      const baselineEnergyJoules =
                        workerWpilibSimStates.length > 0
                          ? workerWpilibSimStates[
                              workerWpilibSimStates.length - 1
                            ].energyJoules
                          : null;
                      const baselineAvgPower =
                        baselineEnergyJoules !== null && hasBaseline
                          ? baselineEnergyJoules / baselineSeconds
                          : null;
                      const baselinePeakCurrent =
                        workerWpilibSimStates.length > 0
                          ? Math.max(
                              ...workerWpilibSimStates.map(
                                (ws) => ws.supplyCurrentDrawAmps,
                              ),
                            )
                          : null;

                      const pctSpan = (pct: number) => (
                        <span
                          className={`ml-1.5 text-xs ${pct < 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {pct > 0 ? '+' : ''}
                          {pct.toFixed(1)}%
                        </span>
                      );

                      const timePct =
                        result && hasBaseline && !isUserRow
                          ? ((result.timeToGoalSeconds - baselineSeconds) /
                              baselineSeconds) *
                            100
                          : null;
                      const energyPct =
                        result && baselineEnergyJoules !== null && !isUserRow
                          ? ((result.energyJoules - baselineEnergyJoules) /
                              baselineEnergyJoules) *
                            100
                          : null;
                      const avgPowerPct =
                        result && baselineAvgPower !== null && !isUserRow
                          ? ((result.energyJoules / result.timeToGoalSeconds -
                              baselineAvgPower) /
                              baselineAvgPower) *
                            100
                          : null;
                      const peakCurrentPct =
                        result && baselinePeakCurrent !== null && !isUserRow
                          ? ((result.peakCurrentAmps - baselinePeakCurrent) /
                              baselinePeakCurrent) *
                            100
                          : null;

                      return (
                        <tr
                          key={s}
                          className={`border-b last:border-0 ${isUserRow ? 'bg-muted font-bold' : ''}`}
                        >
                          <td className="py-1 pr-3">{s} A</td>
                          <td className="py-1 pr-3">
                            {result ? (
                              <>
                                <span>
                                  {result.peakCurrentAmps.toFixed(1)} A
                                </span>
                                {peakCurrentPct !== null &&
                                  pctSpan(peakCurrentPct)}
                              </>
                            ) : (
                              <Skeleton className="inline-block h-3.5 w-14" />
                            )}
                          </td>
                          <td className="py-1 pr-3">
                            {result ? (
                              <>
                                <span>
                                  {result.timeToGoalSeconds.toFixed(3)} s
                                </span>
                                {timePct !== null && pctSpan(timePct)}
                              </>
                            ) : (
                              <Skeleton className="inline-block h-3.5 w-14" />
                            )}
                          </td>
                          <td className="py-1 pr-3">
                            {result ? (
                              <>
                                <span>{result.energyJoules.toFixed(1)} J</span>
                                {energyPct !== null && pctSpan(energyPct)}
                              </>
                            ) : (
                              <Skeleton className="inline-block h-3.5 w-14" />
                            )}
                          </td>
                          <td className="py-1">
                            {result ? (
                              <>
                                <span>
                                  {(
                                    result.energyJoules /
                                    result.timeToGoalSeconds
                                  ).toFixed(1)}{' '}
                                  W
                                </span>
                                {avgPowerPct !== null && pctSpan(avgPowerPct)}
                              </>
                            ) : (
                              <Skeleton className="inline-block h-3.5 w-14" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
