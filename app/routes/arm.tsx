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
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import { MotorInput } from '~/components/recalc/io/motor';
import NumberInput from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
import PctSpan from '~/components/recalc/pctSpan';
import { ChartContainer } from '~/components/ui/chart';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import type * as ArmWorker from '~/lib/math/arm.worker';
import type { ArmOptimizerResult } from '~/lib/math/armOptimizer.worker';
import optimizerWorkerUrl from '~/lib/math/armOptimizer.worker?worker&url';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import {
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioParam,
} from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Arm Calculator' },
    { name: 'description', content: 'Arm Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  motor: MotorParam.withDefault(Motor.KrakenX60sFOC(1)),
  ratio: RatioParam.withDefault(new Ratio(100, RatioType.REDUCTION)),
  statorLimit: MeasurementParam.withDefault(new Measurement(80, 'A')),
  supplyLimit: MeasurementParam.withDefault(new Measurement(60, 'A')),
  supplyVoltage: MeasurementParam.withDefault(new Measurement(12, 'V')),
  statorVoltage: MeasurementParam.withDefault(new Measurement(12, 'V')),
  batteryResistance: MeasurementParam.withDefault(
    new Measurement(0.015, 'Ohm'),
  ),
  armLength: MeasurementParam.withDefault(new Measurement(24, 'in')),
  minAngle: MeasurementParam.withDefault(new Measurement(0, 'deg')),
  maxAngle: MeasurementParam.withDefault(new Measurement(90, 'deg')),
  efficiency: NumberParam.withDefault(100),
  load: MeasurementParam.withDefault(new Measurement(5, 'lb')),
};

const CHART_CONFIG = {} as const;

const worker = new ComlinkWorker<typeof ArmWorker>(
  new URL('../lib/math/arm.worker', import.meta.url),
  {
    type: 'module',
  },
);

const OPTIMIZER_STATOR_LIMITS = [20, 40, 60, 80, 100, 120, 150, 200];

const optimizerPool = workerpool.pool(optimizerWorkerUrl, {
  workerType: 'web',
  workerOpts: { type: 'module' },
});

type WpilibArmSimState = ArmWorker.WpilibArmSimState;

export default function Arm() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [motor, setMotor] = useState(queryParams.motor);
  const [ratio, setRatio] = useState(queryParams.ratio);
  const [statorLimit, setStatorLimit] = useState(queryParams.statorLimit);
  const [supplyLimit, setSupplyLimit] = useState(queryParams.supplyLimit);
  const [supplyVoltage, setSupplyVoltage] = useState(queryParams.supplyVoltage);
  const [statorVoltage, setStatorVoltage] = useState(queryParams.statorVoltage);
  const [batteryResistance, setBatteryResistance] = useState(
    queryParams.batteryResistance,
  );
  const [armLength, setArmLength] = useState(queryParams.armLength);
  const [minAngle, setMinAngle] = useState(queryParams.minAngle);
  const [maxAngle, setMaxAngle] = useState(queryParams.maxAngle);
  const [efficiency, setEfficiency] = useState(queryParams.efficiency);
  const [load, setLoad] = useState(queryParams.load);

  const [goingUpStates, setGoingUpStates] = useState<WpilibArmSimState[]>([]);
  const [goingDownStates, setGoingDownStates] = useState<WpilibArmSimState[]>(
    [],
  );
  const [isCalculating, setIsCalculating] = useState(false);

  const goingUpTimeToGoal = useMemo(() => {
    return new Measurement(
      goingUpStates.length > 0
        ? goingUpStates[goingUpStates.length - 1].timeSeconds
        : 0,
      's',
    );
  }, [goingUpStates]);

  const goingDownTimeToGoal = useMemo(() => {
    return new Measurement(
      goingDownStates.length > 0
        ? goingDownStates[goingDownStates.length - 1].timeSeconds
        : 0,
      's',
    );
  }, [goingDownStates]);

  const momentOfInertia = useMemo(() => {
    return load.mul(armLength.mul(armLength));
  }, [load, armLength]);

  // Convert angularVelocityRadPerSec to RPM for chart display
  const goingUpChartData = useMemo(
    () =>
      goingUpStates.map((s) => ({
        ...s,
        motorRpmDisplay: s.motorRpm,
      })),
    [goingUpStates],
  );

  const goingDownChartData = useMemo(
    () =>
      goingDownStates.map((s) => ({
        ...s,
        motorRpmDisplay: s.motorRpm,
      })),
    [goingDownStates],
  );

  useEffect(() => {
    setGoingUpStates([]);
    setGoingDownStates([]);
    setIsCalculating(true);
    let cancelled = false;

    const upPromise = worker.simulateArmWpilib(
      motor.toDict(),
      ratio.toDict(),
      momentOfInertia.toDict(),
      armLength.toDict(),
      minAngle.toDict(),
      maxAngle.toDict(),
      minAngle.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      'up',
      efficiency / 100,
      0.1,
    );

    const downPromise = worker.simulateArmWpilib(
      motor.toDict(),
      ratio.toDict(),
      momentOfInertia.toDict(),
      armLength.toDict(),
      minAngle.toDict(),
      maxAngle.toDict(),
      maxAngle.toDict(),
      statorVoltage.toDict(),
      supplyVoltage.toDict(),
      statorLimit.toDict(),
      supplyLimit.toDict(),
      batteryResistance.toDict(),
      'down',
      efficiency / 100,
      0.1,
    );

    void Promise.allSettled([upPromise, downPromise]).then(
      ([upResult, downResult]) => {
        if (cancelled) return;
        if (upResult.status === 'fulfilled') {
          setGoingUpStates(upResult.value);
        } else {
          console.error(upResult.reason);
        }
        if (downResult.status === 'fulfilled') {
          setGoingDownStates(downResult.value);
        } else {
          console.error(downResult.reason);
        }
        setIsCalculating(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [
    motor,
    ratio,
    momentOfInertia,
    armLength,
    minAngle,
    maxAngle,
    supplyVoltage,
    supplyLimit,
    statorLimit,
    batteryResistance,
    statorVoltage,
    efficiency,
  ]);

  // Optimizer
  const [optimizerResults, setOptimizerResults] = useState<
    ArmOptimizerResult[]
  >([]);
  const optimizerGeneration = useRef(0);
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);

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
          momentOfInertia.toDict(),
          armLength.toDict(),
          minAngle.toDict(),
          maxAngle.toDict(),
          supplyLimit.toDict(),
          statorVoltage.toDict(),
          batteryResistance.toDict(),
          supplyVoltage.toDict(),
          statorLimitAmps,
          ratio.magnitude,
          efficiency / 100,
        ])
        .then((result: ArmOptimizerResult) => {
          if (gen !== optimizerGeneration.current) return;
          setOptimizerResults((prev) =>
            [...prev, result].sort(
              (a, b) => a.statorLimitAmps - b.statorLimitAmps,
            ),
          );
        })
        .catch((err: unknown) => {
          console.error('Arm optimizer error:', err);
        });
    }
  }, [
    motor,
    momentOfInertia,
    armLength,
    minAngle,
    maxAngle,
    supplyLimit,
    statorVoltage,
    batteryResistance,
    supplyVoltage,
    statorLimit,
    ratio,
    efficiency,
    optimizationEnabled,
    allStatorLimits,
  ]);

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    motor,
    ratio,
    statorLimit,
    supplyLimit,
    supplyVoltage,
    statorVoltage,
    batteryResistance,
    armLength,
    minAngle,
    maxAngle,
    efficiency,
    load,
  });

  const baselineTimeSeconds = Math.max(
    goingUpTimeToGoal.to('s').scalar,
    goingDownTimeToGoal.to('s').scalar,
  );
  const hasBaseline =
    (goingUpStates.length > 0 || goingDownStates.length > 0) &&
    baselineTimeSeconds > 0;

  return (
    <div>
      <div data-testid="arm-main" data-calculating={String(isCalculating)}>
        <CalcHeading
          title="Arm Calculator"
          getSerializedState={() => serializedState}
        />
        <div className="flex flex-row flex-wrap gap-x-4 px-1 *:flex-1">
          <div className="flex flex-col gap-x-4 gap-y-2">
            <IOLine>
              <MotorInput stateHook={[motor, setMotor]} testId="motor" />
              <RatioInput stateHook={[ratio, setRatio]} testId="ratio" />
            </IOLine>

            <IOLine>
              <MeasurementInput
                stateHook={[armLength, setArmLength]}
                label="Arm Length"
                tooltip="The length of the arm from the motor to the center of the load."
                testId="armLength"
              />
              <MeasurementInput
                stateHook={[load, setLoad]}
                label="Load"
                tooltip="The weight of the load."
                testId="load"
              />
            </IOLine>

            <IOLine>
              <MeasurementInput
                stateHook={[minAngle, setMinAngle]}
                label="Min Angle"
                tooltip="The minimum angle the arm can move to."
                testId="minAngle"
              />
              <MeasurementInput
                stateHook={[maxAngle, setMaxAngle]}
                label="Max Angle"
                tooltip="The maximum angle the arm can move to."
                testId="maxAngle"
              />
            </IOLine>

            <IOLine>
              <MeasurementInput
                stateHook={[statorLimit, setStatorLimit]}
                label="Stator Limit"
                tooltip="The current limit applied to the stator."
                testId="statorLimit"
              />
              <MeasurementInput
                stateHook={[supplyLimit, setSupplyLimit]}
                label="Supply Limit"
                tooltip="The current limit applied to the supply (battery). This is *not* supported by REVLib, so make sure the supply power limit is higher than the stator power limit for REV motors."
                testId="supplyLimit"
              />
            </IOLine>

            <IOLine>
              <MeasurementInput
                stateHook={[statorVoltage, setStatorVoltage]}
                label="Stator Voltage"
                tooltip="The voltage applied to the stator."
                testId="statorVoltage"
              />
              <MeasurementInput
                stateHook={[supplyVoltage, setSupplyVoltage]}
                label="Supply Voltage"
                tooltip="The voltage available from the supply (battery) at rest."
                testId="supplyVoltage"
              />
            </IOLine>

            <IOLine>
              <NumberInput
                stateHook={[efficiency, setEfficiency]}
                label="Efficiency"
                tooltip="The efficiency of the arm and gearbox. Typically ~92-97% per stage."
                testId="efficiency"
              />
              <MeasurementInput
                stateHook={[batteryResistance, setBatteryResistance]}
                label="Battery Resistance"
                tooltip="The resistance of the battery."
                testId="batteryResistance"
              />
            </IOLine>

            <IOLine>
              <MeasurementOutput
                state={goingUpTimeToGoal}
                label="Time to Goal (Up)"
                defaultUnit="s"
                testId="goingUpTimeToGoal"
              />
              <MeasurementOutput
                state={goingDownTimeToGoal}
                label="Time to Goal (Down)"
                defaultUnit="s"
                testId="goingDownTimeToGoal"
              />
            </IOLine>
          </div>
          <div className="flex flex-col gap-x-4 gap-y-2">
            <ChartContainer
              config={CHART_CONFIG}
              className="min-h-[200px] w-full"
            >
              <LineChart data={goingUpChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeSeconds" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Line
                  name="Motor RPM"
                  dataKey="motorRpmDisplay"
                  yAxisId="right"
                  dot={false}
                  stroke="blue"
                />
                <Line
                  name="Stator Current (A)"
                  dataKey="statorCurrentDrawAmps"
                  yAxisId="left"
                  dot={false}
                  stroke="goldenrod"
                />
                <Line
                  name="Battery Voltage (V)"
                  dataKey="batteryVoltageVolts"
                  yAxisId="left"
                  dot={false}
                  stroke="green"
                />
              </LineChart>
            </ChartContainer>

            <ChartContainer
              config={CHART_CONFIG}
              className="min-h-[200px] w-full"
            >
              <LineChart data={goingDownChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeSeconds" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Line
                  name="Motor RPM"
                  dataKey="motorRpmDisplay"
                  yAxisId="right"
                  dot={false}
                  stroke="blue"
                />
                <Line
                  name="Stator Current (A)"
                  dataKey="statorCurrentDrawAmps"
                  yAxisId="left"
                  dot={false}
                  stroke="goldenrod"
                />
                <Line
                  name="Battery Voltage (V)"
                  dataKey="batteryVoltageVolts"
                  yAxisId="left"
                  dot={false}
                  stroke="green"
                />
              </LineChart>
            </ChartContainer>
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
        <div className="px-1">
          <section className="flex flex-col rounded-lg border">
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
                    <th className="pr-3 pb-1 font-medium">
                      Worst-Direction
                      <br />
                      Time to Goal
                    </th>
                    <th className="pr-3 pb-1 font-medium">Energy</th>
                    <th className="pb-1 font-medium">Avg Power</th>
                  </tr>
                </thead>
                <tbody>
                  {allStatorLimits.map((statorLimitAmps) => {
                    const result = optimizerResults.find(
                      (r) => r.statorLimitAmps === statorLimitAmps,
                    );
                    const isUserRow = statorLimitAmps === userStatorAmps;

                    const baselineEnergyJoules = hasBaseline
                      ? (goingUpStates.length > 0
                          ? goingUpStates[goingUpStates.length - 1].energyJoules
                          : 0) +
                        (goingDownStates.length > 0
                          ? goingDownStates[goingDownStates.length - 1]
                              .energyJoules
                          : 0)
                      : null;

                    const baselineAvgPower =
                      baselineEnergyJoules !== null && hasBaseline
                        ? baselineEnergyJoules / baselineTimeSeconds
                        : null;

                    const baselinePeakCurrent = hasBaseline
                      ? Math.max(
                          ...goingUpStates.map((s) => s.supplyCurrentDrawAmps),
                          ...goingDownStates.map(
                            (s) => s.supplyCurrentDrawAmps,
                          ),
                        )
                      : null;

                    const timePct =
                      result && hasBaseline
                        ? ((result.timeToGoalSeconds - baselineTimeSeconds) /
                            baselineTimeSeconds) *
                          100
                        : null;
                    const peakCurrentPct =
                      result && baselinePeakCurrent !== null
                        ? ((result.peakSupplyCurrentAmps -
                            baselinePeakCurrent) /
                            baselinePeakCurrent) *
                          100
                        : null;
                    const energyPct =
                      result && baselineEnergyJoules !== null
                        ? ((result.energyJoules - baselineEnergyJoules) /
                            baselineEnergyJoules) *
                          100
                        : null;
                    const resultAvgPower =
                      result && result.timeToGoalSeconds > 0
                        ? result.energyJoules / result.timeToGoalSeconds
                        : null;
                    const avgPowerPct =
                      resultAvgPower !== null && baselineAvgPower !== null
                        ? ((resultAvgPower - baselineAvgPower) /
                            baselineAvgPower) *
                          100
                        : null;

                    return (
                      <tr
                        key={statorLimitAmps}
                        className={`border-b last:border-0 ${isUserRow ? 'bg-muted' : ''}`}
                      >
                        <td className="py-1 pr-3">{statorLimitAmps} A</td>
                        <td className="py-1 pr-3">
                          {result ? (
                            result.optimalRatio.toFixed(1)
                          ) : (
                            <span className="text-muted-foreground">…</span>
                          )}
                        </td>
                        <td className="py-1 pr-3">
                          {result ? (
                            <>
                              {result.peakSupplyCurrentAmps.toFixed(1)} A
                              {peakCurrentPct !== null && (
                                <PctSpan pct={peakCurrentPct} />
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">…</span>
                          )}
                        </td>
                        <td className="py-1 pr-3">
                          {result ? (
                            <>
                              {result.timeToGoalSeconds.toFixed(3)} s
                              {timePct !== null && <PctSpan pct={timePct} />}
                            </>
                          ) : (
                            <span className="text-muted-foreground">…</span>
                          )}
                        </td>
                        <td className="py-1 pr-3">
                          {result ? (
                            <>
                              {result.energyJoules.toFixed(1)} J
                              {energyPct !== null && (
                                <PctSpan pct={energyPct} />
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">…</span>
                          )}
                        </td>
                        <td className="py-1">
                          {result && resultAvgPower !== null ? (
                            <>
                              {resultAvgPower.toFixed(1)} W
                              {avgPowerPct !== null && (
                                <PctSpan pct={avgPowerPct} />
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">…</span>
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
      )}
    </div>
  );
}
