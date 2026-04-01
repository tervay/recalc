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
  MeasurementDisplayOutput,
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import { MotorInput } from '~/components/recalc/io/motor';
import NumberInput from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
import { ReorderList } from '~/components/recalc/reorderList';
import { Loader } from '~/components/shadix-ui/components/loader';
import { Button } from '~/components/ui/button';
import { ChartContainer } from '~/components/ui/chart';
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { computeShotResult } from '~/lib/math/ballShot';
import type * as FlywheelWorker from '~/lib/math/flywheel.worker';
import type {
  FlywheelConfigOptOutput,
  OptimizationPriority,
} from '~/lib/math/flywheelOptimizer.worker';
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
  shooterDiameter: MeasurementParam.withDefault(new Measurement(4, 'in')),
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
  flywheelEnabled: BooleanParam.withDefault(false),
  flywheelToShooterRatio: RatioParam.withDefault(
    new Ratio(1, RatioType.REDUCTION),
  ),
  projectileDiameter: MeasurementParam.withDefault(new Measurement(5, 'in')),
  projectileWeight: MeasurementParam.withDefault(new Measurement(0.5, 'lb')),
  efficiency: NumberParam.withDefault(100),
  maximumComfortableStatorLimit: MeasurementParam.withDefault(
    new Measurement(80, 'A'),
  ),
  maximumComfortableSupplyLimit: MeasurementParam.withDefault(
    new Measurement(60, 'A'),
  ),
};

const CHART_CONFIG = {} as const;

const worker = new ComlinkWorker<typeof FlywheelWorker>(
  new URL('../lib/math/flywheel.worker', import.meta.url),
  {
    type: 'module',
  },
);

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
  const [flywheelEnabled, setFlywheelEnabled] = useState(
    queryParams.flywheelEnabled,
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
  const [projectileDiameter, setProjectileDiameter] = useState(
    queryParams.projectileDiameter,
  );
  const [projectileWeight, setProjectileWeight] = useState(
    queryParams.projectileWeight,
  );
  const [efficiency, setEfficiency] = useState(queryParams.efficiency);
  const [maximumComfortableStatorLimit, setMaximumComfortableStatorLimit] =
    useState(queryParams.maximumComfortableStatorLimit);
  const [maximumComfortableSupplyLimit, setMaximumComfortableSupplyLimit] =
    useState(queryParams.maximumComfortableSupplyLimit);

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
      flywheelEnabled
        ? usableShooterMOI.add(
            usableFlywheelMOI.div(
              flywheelToShooterRatio.asNumber() == 0
                ? 1
                : Math.pow(flywheelToShooterRatio.asNumber(), 2),
            ),
          )
        : usableShooterMOI,
    [
      flywheelEnabled,
      usableShooterMOI,
      usableFlywheelMOI,
      flywheelToShooterRatio,
    ],
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

  // Shot analysis: energy transfer to ball and resulting flywheel speed drop.
  // Ball is modeled as a hollow sphere (I = 2/3 * m * r^2) exiting at shooter
  // surface speed with pure rolling contact.
  const shotAnalysis = useMemo(() => {
    if (workerWpilibSimStates.length === 0) return null;

    return computeShotResult(
      clampedShooterTargetSpeed,
      shooterDiameter.div(2),
      combinedMOI,
      projectileWeight,
      projectileDiameter.div(2),
    );
  }, [
    workerWpilibSimStates,
    clampedShooterTargetSpeed,
    shooterDiameter,
    projectileDiameter,
    projectileWeight,
    combinedMOI,
  ]);

  const postShotOmegaRadPerSec = useMemo(
    () => shotAnalysis?.postShotOmega.to('rad/s').scalar ?? null,
    [shotAnalysis],
  );

  const [recoverySimStates, setRecoverySimStates] = useState<
    WpilibFlywheelSimState[]
  >([]);
  const [isRecoveryCalculating, startRecoveryCalculating] = useTransition();

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

  // Recovery simulation: runs from post-shot speed back to target speed.
  useEffect(() => {
    if (postShotOmegaRadPerSec === null) {
      setRecoverySimStates([]);
      return;
    }
    let cancelled = false;
    startRecoveryCalculating(async () => {
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
          postShotOmegaRadPerSec,
        );
        if (!cancelled) setRecoverySimStates(states);
      } catch (error) {
        console.error(error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    postShotOmegaRadPerSec,
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

  const recoveryTime = useMemo(() => {
    if (recoverySimStates.length === 0) return new Measurement(0, 's');
    return new Measurement(
      recoverySimStates[recoverySimStates.length - 1].timeSeconds,
      's',
    );
  }, [recoverySimStates]);

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
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const [priorities, setPriorities] =
    useState<OptimizationPriority[]>(DEFAULT_PRIORITIES);
  const [tierTolerance, setTierTolerance] = useState(10);
  const [gridDisplayMode, setGridDisplayMode] =
    useState<GridDisplayMode>('ratio');
  const [configOptResult, setConfigOptResult] =
    useState<FlywheelConfigOptOutput | null>(null);
  const configOptGeneration = useRef(0);

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
        combinedMOI.toDict(),
        clampedShooterTargetSpeed.toDict(),
        nominalVoltage.toDict(),
        batteryResistance.toDict(),
        supplyVoltage.toDict(),
        maximumComfortableStatorLimit.toDict(),
        maximumComfortableSupplyLimit.toDict(),
        efficiency / 100,
        0.1,
        priorities,
        tierTolerance / 100,
      ])
      .then((result: FlywheelConfigOptOutput) => {
        if (gen !== configOptGeneration.current) return;
        setConfigOptResult(result);
      })
      .catch((err: unknown) => {
        console.error('Flywheel optimizer error:', err);
      });
  }, [
    motor,
    combinedMOI,
    clampedShooterTargetSpeed,
    batteryResistance,
    supplyVoltage,
    maximumComfortableStatorLimit,
    maximumComfortableSupplyLimit,
    efficiency,
    optimizationEnabled,
    priorities,
    tierTolerance,
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
    flywheelEnabled,
    flywheelDiameter,
    flywheelWeight,
    customFlywheelMoi,
    useCustomFlywheelMoi,
    flywheelToShooterRatio,
    projectileDiameter,
    projectileWeight,
    efficiency,
    maximumComfortableStatorLimit,
    maximumComfortableSupplyLimit,
  });

  return (
    <div>
      <div
        data-testid="flywheel-main"
        data-calculating={String(isCalculating || isRecoveryCalculating)}
      >
        <CalcHeading
          title="Flywheel Calculator"
          getSerializedState={() => serializedState}
        />
        <div className="flex flex-row flex-wrap gap-6 px-1">
          {/* Left column: inputs */}
          <div className="flex min-w-[300px] flex-1 flex-col">
            <section className="flex flex-col rounded-lg border">
              {/* Motors & Electrical */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Motors &amp; Electrical
                </h2>
                <IOLine>
                  <MotorInput
                    stateHook={[motor, setMotor]}
                    testId="motor"
                    labelAbove
                  />
                  <NumberInput
                    stateHook={[efficiency, setEfficiency]}
                    label="Efficiency (%)"
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
                </IOLine>
                <IOLine>
                  <MeasurementInput
                    stateHook={[statorLimit, setStatorLimit]}
                    label="Stator Limit"
                    testId="statorLimit"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[supplyLimit, setSupplyLimit]}
                    label="Supply Limit"
                    testId="supplyLimit"
                    labelAbove
                  />
                </IOLine>
                <IOLine>
                  <MeasurementInput
                    stateHook={[supplyVoltage, setSupplyVoltage]}
                    label="Supply Voltage"
                    testId="supplyVoltage"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[batteryResistance, setBatteryResistance]}
                    label="Battery Resistance"
                    testId="batteryResistance"
                    labelAbove
                  />
                </IOLine>
              </div>
              <div className="border-t" />

              {/* Shooter Wheel */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Shooter Wheel
                </h2>
                <IOLine>
                  <MeasurementInput
                    stateHook={[shooterDiameter, setShooterDiameter]}
                    label="Shooter Diameter"
                    testId="shooterDiameter"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[shooterTargetSpeed, setShooterTargetSpeed]}
                    label="Shooter Target Speed"
                    testId="shooterTargetSpeed"
                    labelAbove
                  />
                </IOLine>
                <IOLine>
                  <MeasurementInput
                    stateHook={[shooterWeight, setShooterWeight]}
                    label="Shooter Weight"
                    testId="shooterWeight"
                    labelAbove
                  />
                  <MeasurementOutput
                    state={maxAchievableShooterRPM}
                    label="Max Achievable RPM"
                    defaultUnit="rpm"
                    roundTo={0}
                    testId="maxAchievableShooterRpm"
                    labelAbove
                  />
                </IOLine>
                <div className="flex flex-row flex-wrap items-end gap-x-4 md:flex-nowrap">
                  <div className="flex-1">
                    {useCustomShooterMoi ? (
                      <MeasurementInput
                        stateHook={[customShooterMoi, setCustomShooterMoi]}
                        label="Custom Shooter MOI"
                        disabled={() => !useCustomShooterMoi}
                        testId="customShooterMoi"
                        labelAbove
                      />
                    ) : (
                      <MeasurementOutput
                        state={derivedShooterMOI}
                        label="Shooter MOI"
                        defaultUnit="in2*lbs"
                        testId="derivedShooterMoi"
                        labelAbove
                      />
                    )}
                  </div>
                  <div className="flex h-9 flex-1 items-center">
                    <BooleanInput
                      stateHook={[useCustomShooterMoi, setUseCustomShooterMoi]}
                      label="Use Custom Shooter MOI"
                      testId="useCustomShooterMoi"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t" />

              {/* Flywheel */}
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Flywheel
                  </h2>
                  <BooleanInput
                    stateHook={[flywheelEnabled, setFlywheelEnabled]}
                    label="Enabled"
                    testId="flywheelEnabled"
                  />
                </div>
                {flywheelEnabled ? (
                  <>
                    <IOLine>
                      <MeasurementInput
                        stateHook={[flywheelDiameter, setFlywheelDiameter]}
                        label="Flywheel Diameter"
                        testId="flywheelDiameter"
                        labelAbove
                      />
                      <MeasurementInput
                        stateHook={[flywheelWeight, setFlywheelWeight]}
                        label="Flywheel Weight"
                        testId="flywheelWeight"
                        labelAbove
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
                        labelAbove
                      />
                    </IOLine>
                    <div className="flex flex-row flex-wrap items-end gap-x-4 md:flex-nowrap">
                      <div className="flex-1">
                        {useCustomFlywheelMoi ? (
                          <MeasurementInput
                            stateHook={[
                              customFlywheelMoi,
                              setCustomFlywheelMoi,
                            ]}
                            label="Custom Flywheel MOI"
                            disabled={() => !useCustomFlywheelMoi}
                            testId="customFlywheelMoi"
                            labelAbove
                          />
                        ) : (
                          <MeasurementOutput
                            state={derivedFlywheelMOI}
                            label="Flywheel MOI"
                            defaultUnit="in2*lbs"
                            testId="derivedFlywheelMoi"
                            labelAbove
                          />
                        )}
                      </div>
                      <div className="flex h-9 flex-1 items-center">
                        <BooleanInput
                          stateHook={[
                            useCustomFlywheelMoi,
                            setUseCustomFlywheelMoi,
                          ]}
                          label="Use Custom Flywheel MOI"
                          testId="useCustomFlywheelMoi"
                        />
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
              <div className="border-t" />

              {/* Projectile */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Projectile
                </h2>
                <IOLine>
                  <MeasurementInput
                    stateHook={[projectileDiameter, setProjectileDiameter]}
                    label="Projectile Diameter"
                    testId="projectileDiameter"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[projectileWeight, setProjectileWeight]}
                    label="Projectile Weight"
                    testId="projectileWeight"
                    labelAbove
                  />
                </IOLine>
              </div>
            </section>
          </div>

          {/* Right column: outputs + chart */}
          <div className="flex min-w-[300px] flex-1 flex-col gap-4">
            <section className="flex flex-col rounded-lg border">
              {/* Top KPIs */}
              <div className="grid grid-cols-2 gap-2 p-4">
                <MeasurementDisplayOutput
                  state={spinupTime}
                  label="Spinup Time"
                  defaultUnit="s"
                  testId="spinupTime"
                />
                <MeasurementDisplayOutput
                  state={recoveryTime}
                  label="Recovery Time"
                  defaultUnit="s"
                  testId="recoveryTime"
                />
              </div>
              <div className="border-t" />

              {/* Simulation chart */}
              <div className="p-4 pb-2">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Simulation
                </h2>
                <ChartContainer
                  config={CHART_CONFIG}
                  className="min-h-[200px] w-full"
                  data-testid="chart"
                >
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
                        value: 'Current (A) / Voltage (V)',
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
                        value: 'Angular Velocity (RPM)',
                        angle: 90,
                        position: 'insideRight',
                        offset: 15,
                        style: { textAnchor: 'middle' },
                      }}
                    />
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
              <div className="border-t" />

              {/* Feedforward constants + Effective MOI */}
              <div className="grid grid-cols-3 gap-2 p-4">
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
                  state={effectiveMOI}
                  label="Effective MOI"
                  defaultUnit="in2*lbs"
                  testId="effectiveMoi"
                />
              </div>
              <div className="border-t" />

              {/* Shot Analysis */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Shot Analysis
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <MeasurementDisplayOutput
                    state={
                      shotAnalysis?.exitVelocity ?? new Measurement(0, 'ft/s')
                    }
                    label="Ball Exit Velocity"
                    defaultUnit="ft/s"
                    testId="ballExitVelocity"
                  />
                  <MeasurementDisplayOutput
                    state={
                      shotAnalysis?.exitSpinRate ?? new Measurement(0, 'rpm')
                    }
                    label="Ball Spin Rate"
                    defaultUnit="rpm"
                    roundTo={0}
                    testId="ballSpinRate"
                  />
                  <MeasurementDisplayOutput
                    state={
                      shotAnalysis?.ballKineticEnergy ?? new Measurement(0, 'J')
                    }
                    label="Energy to Ball"
                    defaultUnit="J"
                    testId="energyToBall"
                  />
                  <MeasurementDisplayOutput
                    state={
                      shotAnalysis
                        ? clampedShooterTargetSpeed.sub(
                            shotAnalysis.postShotOmega.to('rpm'),
                          )
                        : new Measurement(0, 'rpm')
                    }
                    label="Speed Drop"
                    defaultUnit="rpm"
                    roundTo={0}
                    testId="speedDrop"
                  />
                  <MeasurementDisplayOutput
                    state={
                      shotAnalysis?.postShotOmega.to('rpm') ??
                      new Measurement(0, 'rpm')
                    }
                    label="Post-Shot Speed"
                    defaultUnit="rpm"
                    roundTo={0}
                    testId="postShotSpeed"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Mechanism Optimization */}
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
                    cell: import('~/lib/math/flywheelOptimizer.worker').FlywheelConfigOptResult,
                  ) => {
                    switch (gridDisplayMode) {
                      case 'ratio':
                        return cell.optimalRatio.toFixed(2);
                      case 'peakCurrent':
                        return `${cell.peakSupplyCurrentAmps.toFixed(1)} A`;
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
                                            {cell.peakSupplyCurrentAmps.toFixed(
                                              1,
                                            )}{' '}
                                            A
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
