import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { ChartContainer } from '~/components/ui/chart';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import type * as FlywheelWorker from '~/lib/math/flywheel.worker';
import type { FlywheelOptimizerResult } from '~/lib/math/flywheelOptimizer.worker';
import optimizerWorkerUrl from '~/lib/math/flywheelOptimizer.worker?worker&url';
import { calculateKa, calculateKv } from '~/lib/math/kVkA';
import Measurement from '~/lib/models/Measurement';
import Motor, { nominalVoltage } from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { MotorRules } from '~/lib/rules';
import {
  BooleanParam,
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioParam,
} from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Flywheel Calculator' },
    { name: 'description', content: 'Flywheel Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  motor: MotorParam.withDefault(Motor.KrakenX60sFOC(2)),
  ratio: RatioParam.withDefault(new Ratio(1, RatioType.REDUCTION)),
  statorLimit: MeasurementParam.withDefault(new Measurement(80, 'A')),
  supplyLimit: MeasurementParam.withDefault(new Measurement(60, 'A')),
  supplyVoltage: MeasurementParam.withDefault(new Measurement(12.6, 'V')),
  batteryResistance: MeasurementParam.withDefault(
    new Measurement(0.015, 'Ohm'),
  ),
  shooterDiameter: MeasurementParam.withDefault(new Measurement(6, 'in')),
  shooterWeight: MeasurementParam.withDefault(new Measurement(1, 'lb')),
  shooterTargetSpeed: MeasurementParam.withDefault(
    new Measurement(3000, 'rpm'),
  ),
  customShooterMoi: MeasurementParam.withDefault(
    new Measurement(4.5, 'in2*lbs'),
  ),
  useCustomShooterMoi: BooleanParam.withDefault(false),
  flywheelDiameter: MeasurementParam.withDefault(new Measurement(4, 'in')),
  flywheelWeight: MeasurementParam.withDefault(new Measurement(1.5, 'lb')),
  customFlywheelMoi: MeasurementParam.withDefault(
    new Measurement(3, 'in2*lbs'),
  ),
  useCustomFlywheelMoi: BooleanParam.withDefault(false),
  flywheelToShooterRatio: RatioParam.withDefault(
    new Ratio(1, RatioType.REDUCTION),
  ),
  projectileDiameter: MeasurementParam.withDefault(new Measurement(4, 'in')),
  projectileWeight: MeasurementParam.withDefault(new Measurement(0.5, 'lb')),
  efficiency: NumberParam.withDefault(100),
};

const CHART_CONFIG = {} as const;

const worker = new ComlinkWorker<typeof FlywheelWorker>(
  new URL('../lib/math/flywheel.worker', import.meta.url),
  {
    type: 'module',
  },
);

const OPTIMIZER_STATOR_LIMITS = [20, 30, 40, 50, 60, 70, 80];

const optimizerPool = workerpool.pool(optimizerWorkerUrl, {
  workerType: 'web',
  workerOpts: { type: 'module' },
});

type WpilibFlywheelSimState = FlywheelWorker.WpilibFlywheelSimState;

export default function Flywheel() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [motor, setMotor] = useState(queryParams.motor);
  const [ratio, setRatio] = useState(queryParams.ratio);
  const [statorLimit, setStatorLimit] = useState(queryParams.statorLimit);
  const [supplyLimit, setSupplyLimit] = useState(queryParams.supplyLimit);
  const [supplyVoltage, setSupplyVoltage] = useState(queryParams.supplyVoltage);
  const [batteryResistance, setBatteryResistance] = useState(
    queryParams.batteryResistance,
  );
  const [shooterDiameter, setShooterDiameter] = useState(
    queryParams.shooterDiameter,
  );
  const [shooterWeight, setShooterWeight] = useState(queryParams.shooterWeight);
  const [shooterTargetSpeed, setShooterTargetSpeed] = useState(
    queryParams.shooterTargetSpeed,
  );
  const [customShooterMoi, setCustomShooterMoi] = useState(
    queryParams.customShooterMoi,
  );
  const [useCustomShooterMoi, setUseCustomShooterMoi] = useState(
    queryParams.useCustomShooterMoi,
  );
  const [flywheelDiameter, setFlywheelDiameter] = useState(
    queryParams.flywheelDiameter,
  );
  const [flywheelWeight, setFlywheelWeight] = useState(
    queryParams.flywheelWeight,
  );
  const [customFlywheelMoi, setCustomFlywheelMoi] = useState(
    queryParams.customFlywheelMoi,
  );
  const [useCustomFlywheelMoi, setUseCustomFlywheelMoi] = useState(
    queryParams.useCustomFlywheelMoi,
  );
  const [flywheelToShooterRatio, setflywheelToShooterRatio] = useState(
    queryParams.flywheelToShooterRatio,
  );
  const [_projectileDiameter] = useState(queryParams.projectileDiameter);
  const [projectileWeight, _setProjectileWeight] = useState(
    queryParams.projectileWeight,
  );
  const [efficiency, setEfficiency] = useState(queryParams.efficiency);

  const derivedShooterMOI = useMemo(
    () =>
      shooterWeight
        .mul(shooterDiameter.div(2).mul(shooterDiameter.div(2)))
        .div(2),
    [shooterWeight, shooterDiameter],
  );

  const derivedFlywheelMOI = useMemo(
    () =>
      flywheelWeight
        .mul(flywheelDiameter.div(2).mul(flywheelDiameter.div(2)))
        .div(2),
    [flywheelWeight, flywheelDiameter],
  );

  const usableShooterMOI = useMemo(
    () => (useCustomShooterMoi ? customShooterMoi : derivedShooterMOI),
    [useCustomShooterMoi, customShooterMoi, derivedShooterMOI],
  );

  const usableFlywheelMOI = useMemo(
    () => (useCustomFlywheelMoi ? customFlywheelMoi : derivedFlywheelMOI),
    [useCustomFlywheelMoi, customFlywheelMoi, derivedFlywheelMOI],
  );

  // Combined MOI of the shooter + flywheel assembly (load-side, before gearing).
  // This is what FlywheelSim expects — it handles the motor-to-load gearing
  // internally via its plant model.
  const combinedMOI = useMemo(
    () =>
      usableShooterMOI.add(
        usableFlywheelMOI.div(
          flywheelToShooterRatio.asNumber() == 0
            ? 1
            : Math.pow(flywheelToShooterRatio.asNumber(), 2),
        ),
      ),
    [usableShooterMOI, usableFlywheelMOI, flywheelToShooterRatio],
  );

  // Effective MOI reflected to the motor shaft (for display only).
  const effectiveMOI = useMemo(
    () =>
      ratio.asNumber() === 0
        ? new Measurement(0, 'in2*lbs')
        : combinedMOI.div(Math.pow(ratio.asNumber(), 2)).to('in2*lbs'),
    [combinedMOI, ratio],
  );

  const kV = useMemo(() => {
    if (ratio.asNumber() == 0) {
      return new Measurement(0, 'V*s/m');
    }

    return calculateKv(
      motor.freeSpeed.div(ratio.asNumber()),
      shooterDiameter.div(2),
    );
  }, [motor, ratio, shooterDiameter]);

  const kA = useMemo(() => {
    if (shooterDiameter.baseScalar == 0 || motor.quantity === 0) {
      return new Measurement(0, 'V*s^2/m');
    }

    return calculateKa(
      new MotorRules(motor, statorLimit, {
        voltage: nominalVoltage,
        rpm: new Measurement(0, 'rpm'),
      })
        .solve()
        .torque.mul(motor.quantity)
        .mul(ratio.asNumber())
        .mul(efficiency / 100),
      shooterDiameter.div(2),
      combinedMOI.div(shooterDiameter.div(2).mul(shooterDiameter.div(2))),
    );
  }, [shooterDiameter, motor, statorLimit, ratio, efficiency, combinedMOI]);

  const maxAchievableShooterRPM = useMemo(() => {
    if (ratio.asNumber() === 0) {
      return new Measurement(0, 'rpm');
    }
    return motor.freeSpeed.div(ratio.asNumber());
  }, [motor, ratio]);

  const clampedShooterTargetSpeed = useMemo(() => {
    return Measurement.min(shooterTargetSpeed, maxAchievableShooterRPM);
  }, [shooterTargetSpeed, maxAchievableShooterRPM]);

  const [workerWpilibSimStates, setWorkerWpilibSimStates] = useState<
    WpilibFlywheelSimState[]
  >([]);
  const [isCalculating, startCalculating] = useTransition();

  const spinupTime = useMemo(() => {
    return workerWpilibSimStates.length > 0
      ? new Measurement(
          workerWpilibSimStates[workerWpilibSimStates.length - 1].timeSeconds,
          's',
        )
      : new Measurement(0, 's');
  }, [workerWpilibSimStates]);

  useEffect(() => {
    let cancelled = false;
    startCalculating(async () => {
      try {
        const states = await worker.simulateFlywheelWpilib(
          motor.toDict(),
          ratio.toDict(),
          statorLimit.toDict(),
          supplyLimit.toDict(),
          nominalVoltage.toDict(),
          batteryResistance.toDict(),
          supplyVoltage.toDict(),
          combinedMOI.toDict(),
          clampedShooterTargetSpeed.toDict(),
          efficiency / 100,
          0.1,
        );
        if (!cancelled) setWorkerWpilibSimStates(states);
      } catch (error) {
        console.error(error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    motor,
    ratio,
    statorLimit,
    supplyLimit,
    supplyVoltage,
    batteryResistance,
    combinedMOI,
    clampedShooterTargetSpeed,
    efficiency,
  ]);

  // Chart data: convert angular velocity from rad/s to RPM for display
  const chartData = useMemo(
    () =>
      workerWpilibSimStates.map((s) => ({
        ...s,
        angularVelocityRpm: (s.angularVelocityRadPerSec * 60) / (2 * Math.PI),
      })),
    [workerWpilibSimStates],
  );

  // Optimizer
  const [optimizerResults, setOptimizerResults] = useState<
    FlywheelOptimizerResult[]
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
          combinedMOI.toDict(),
          clampedShooterTargetSpeed.toDict(),
          supplyLimit.toDict(),
          nominalVoltage.toDict(),
          batteryResistance.toDict(),
          supplyVoltage.toDict(),
          statorLimitAmps,
          ratio.magnitude,
          efficiency / 100,
          0.1,
        ])
        .then((result: FlywheelOptimizerResult) => {
          if (gen !== optimizerGeneration.current) return;
          setOptimizerResults((prev) =>
            [...prev, result].sort(
              (a, b) => a.statorLimitAmps - b.statorLimitAmps,
            ),
          );
        })
        .catch((err: unknown) => {
          console.error('Flywheel optimizer error:', err);
        });
    }
  }, [
    motor,
    combinedMOI,
    clampedShooterTargetSpeed,
    supplyLimit,
    batteryResistance,
    supplyVoltage,
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
    batteryResistance,
    shooterDiameter,
    shooterWeight,
    shooterTargetSpeed,
    customShooterMoi,
    useCustomShooterMoi,
    flywheelDiameter,
    flywheelWeight,
    customFlywheelMoi,
    useCustomFlywheelMoi,
    flywheelToShooterRatio,
    projectileDiameter: queryParams.projectileDiameter,
    projectileWeight,
    efficiency,
  });

  return (
    <div>
      <div data-testid="flywheel-main" data-calculating={String(isCalculating)}>
        <CalcHeading
          title="Flywheel Calculator"
          getSerializedState={() => serializedState}
        />
        <div className="flex flex-row flex-wrap gap-x-4 px-1 *:flex-1">
          <div className="flex flex-col gap-x-4 gap-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Motors & Electrical</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2">
                <IOLine>
                  <MotorInput stateHook={[motor, setMotor]} testId="motor" />
                  <RatioInput stateHook={[ratio, setRatio]} testId="ratio" />
                </IOLine>

                <IOLine>
                  <MeasurementInput
                    stateHook={[statorLimit, setStatorLimit]}
                    label="Stator Limit"
                    testId="statorLimit"
                  />
                  <MeasurementInput
                    stateHook={[supplyLimit, setSupplyLimit]}
                    label="Supply Limit"
                    testId="supplyLimit"
                  />
                </IOLine>

                <IOLine>
                  <MeasurementInput
                    stateHook={[supplyVoltage, setSupplyVoltage]}
                    label="Supply Voltage"
                    testId="supplyVoltage"
                  />
                  <MeasurementInput
                    stateHook={[batteryResistance, setBatteryResistance]}
                    label="Battery Resistance"
                    testId="batteryResistance"
                  />
                </IOLine>

                <IOLine>
                  <NumberInput
                    stateHook={[efficiency, setEfficiency]}
                    label="Efficiency (%)"
                    testId="efficiency"
                  />
                </IOLine>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shooter Wheel Properties</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2">
                <IOLine>
                  <MeasurementInput
                    stateHook={[shooterDiameter, setShooterDiameter]}
                    label="Shooter Diameter"
                    testId="shooterDiameter"
                  />
                  <MeasurementInput
                    stateHook={[shooterWeight, setShooterWeight]}
                    label="Shooter Weight"
                    testId="shooterWeight"
                  />
                </IOLine>

                <IOLine>
                  <MeasurementInput
                    stateHook={[shooterTargetSpeed, setShooterTargetSpeed]}
                    label="Shooter Target Speed"
                    testId="shooterTargetSpeed"
                  />
                  <MeasurementOutput
                    state={maxAchievableShooterRPM}
                    label="Max Achievable RPM"
                    defaultUnit="rpm"
                    roundTo={0}
                    testId="maxAchievableShooterRpm"
                  />
                </IOLine>

                <IOLine>
                  {useCustomShooterMoi ? (
                    <MeasurementInput
                      stateHook={[customShooterMoi, setCustomShooterMoi]}
                      label="Custom Shooter MOI"
                      disabled={() => !useCustomShooterMoi}
                      testId="customShooterMoi"
                    />
                  ) : (
                    <MeasurementOutput
                      state={derivedShooterMOI}
                      label="Shooter MOI"
                      defaultUnit="in2*lbs"
                      testId="derivedShooterMoi"
                    />
                  )}
                  <BooleanInput
                    stateHook={[useCustomShooterMoi, setUseCustomShooterMoi]}
                    label="Use Custom Shooter MOI"
                    testId="useCustomShooterMoi"
                  />
                </IOLine>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flywheel Properties</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2">
                <IOLine>
                  <MeasurementInput
                    stateHook={[flywheelDiameter, setFlywheelDiameter]}
                    label="Flywheel Diameter"
                    testId="flywheelDiameter"
                  />
                  <MeasurementInput
                    stateHook={[flywheelWeight, setFlywheelWeight]}
                    label="Flywheel Weight"
                    testId="flywheelWeight"
                  />
                </IOLine>

                <IOLine>
                  <RatioInput
                    label="Flywheel to Shooter Ratio"
                    stateHook={[
                      flywheelToShooterRatio,
                      setflywheelToShooterRatio,
                    ]}
                    testId="flywheelToShooterRatio"
                  />
                </IOLine>

                <IOLine>
                  {useCustomFlywheelMoi ? (
                    <MeasurementInput
                      stateHook={[customFlywheelMoi, setCustomFlywheelMoi]}
                      label="Custom Flywheel MOI"
                      disabled={() => !useCustomFlywheelMoi}
                      testId="customFlywheelMoi"
                    />
                  ) : (
                    <MeasurementOutput
                      state={derivedFlywheelMOI}
                      label="Flywheel MOI"
                      defaultUnit="in2*lbs"
                      testId="derivedFlywheelMoi"
                    />
                  )}
                  <BooleanInput
                    stateHook={[useCustomFlywheelMoi, setUseCustomFlywheelMoi]}
                    label="Use Custom Flywheel MOI"
                    testId="useCustomFlywheelMoi"
                  />
                </IOLine>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outputs</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2">
                <IOLine>
                  <MeasurementOutput
                    state={spinupTime}
                    label="Spinup Time"
                    defaultUnit="s"
                    testId="spinupTime"
                  />
                </IOLine>

                <IOLine>
                  <MeasurementOutput
                    state={effectiveMOI}
                    label="Effective MOI"
                    defaultUnit="in2*lbs"
                    testId="effectiveMoi"
                  />
                </IOLine>

                <IOLine>
                  <MeasurementOutput
                    state={kV}
                    label="kV"
                    defaultUnit="V*s/m"
                    testId="kV"
                  />
                  <MeasurementOutput
                    state={kA}
                    label="kA"
                    defaultUnit="V*s^2/m"
                    testId="kA"
                  />
                </IOLine>
              </CardContent>
            </Card>
          </div>
          <ChartContainer
            config={CHART_CONFIG}
            className="min-h-[200px] w-full"
            data-testid="chart"
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timeSeconds"
                tickFormatter={(v: number) =>
                  parseFloat(v.toPrecision(3)).toString()
                }
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Line
                name="Angular Velocity (RPM)"
                dataKey="angularVelocityRpm"
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
                name="Supply Current (A)"
                dataKey="supplyCurrentDrawAmps"
                yAxisId="left"
                dot={false}
                stroke="purple"
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

      {/* Ratio Optimization */}
      <div className="my-6 flex items-center gap-4 px-1">
        <div className="flex-1 border-t" />
        <BooleanInput
          stateHook={[optimizationEnabled, setOptimizationEnabled]}
          label="Ratio Optimization"
          testId="optimizationEnabled"
        />
        <div className="flex-1 border-t" />
      </div>

      {optimizationEnabled ? (
        <div className="px-1">
          <section className="flex flex-col rounded-lg border">
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Optimal Ratio by Stator Limit
              </h2>
              <table className="w-full text-sm tabular-nums">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pr-3 pb-1 font-medium">
                      Per-Motor
                      <br />
                      Stator Limit
                    </th>
                    <th className="pr-3 pb-1 font-medium">Optimal Ratio</th>
                    <th className="pr-3 pb-1 font-medium">
                      Peak Supply
                      <br />
                      Current
                    </th>
                    <th className="pr-3 pb-1 font-medium">Spinup Time</th>
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
                    const baselineSeconds = spinupTime.to('s').scalar;
                    const hasBaseline =
                      workerWpilibSimStates.length > 0 && baselineSeconds > 0;

                    return (
                      <tr
                        key={statorLimitAmps}
                        className={`border-b last:border-0 ${isUserRow ? 'bg-muted/50 font-medium' : ''}`}
                      >
                        <td className="py-1 pr-3">{statorLimitAmps} A</td>
                        {result ? (
                          <>
                            <td className="py-1 pr-3">
                              {result.optimalRatio.toFixed(2)}:1
                            </td>
                            <td className="py-1 pr-3">
                              {result.peakSupplyCurrentAmps.toFixed(1)} A
                            </td>
                            <td className="py-1 pr-3">
                              {result.timeToGoalSeconds.toFixed(3)} s
                              {hasBaseline ? (
                                <PctSpan
                                  pct={
                                    ((result.timeToGoalSeconds -
                                      baselineSeconds) /
                                      baselineSeconds) *
                                    100
                                  }
                                  decimals={0}
                                />
                              ) : null}
                            </td>
                            <td className="py-1 pr-3">
                              {result.energyJoules.toFixed(1)} J
                            </td>
                            <td className="py-1">
                              {result.timeToGoalSeconds > 0
                                ? (
                                    result.energyJoules /
                                    result.timeToGoalSeconds
                                  ).toFixed(0)
                                : 0}{' '}
                              W
                            </td>
                          </>
                        ) : (
                          <td
                            colSpan={5}
                            className="py-1 text-muted-foreground"
                          >
                            Optimizing...
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
