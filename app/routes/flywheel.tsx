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
import * as z from 'zod';
import ChevronDownIcon from '~icons/lucide/chevron-down';
import TriangleAlertIcon from '~icons/lucide/triangle-alert';

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
import { StringSelectInput } from '~/components/recalc/io/stringSelect';
import { OptimalConfigGrid } from '~/components/recalc/optimalConfigGrid';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { ChartContainer } from '~/components/ui/chart';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import { computeShotResult, type ShooterMode } from '~/lib/math/ballShot';
import { FLYWHEEL_SIMULATION_TIMEOUT_SECONDS } from '~/lib/math/flywheel.worker';
import type * as FlywheelWorker from '~/lib/math/flywheel.worker';
import type * as FlywheelOptimizerWorker from '~/lib/math/flywheelOptimizer.worker';
import type {
  ConfigOptOutput,
  ConfigOptResult,
} from '~/lib/math/flywheelOptimizer.worker';
import optimizerWorkerUrl from '~/lib/math/flywheelOptimizer.worker?worker&url';
import Measurement from '~/lib/models/Measurement';
import Motor, { nominalVoltage } from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { getPool } from '~/lib/pool';
import { buildMeta, pageUrl } from '~/lib/seo';
import {
  BooleanParam,
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioParam,
  StringParam,
} from '~/lib/types/queryParams';

const FLYWHEEL_PATH = '/flywheel';
const FLYWHEEL_TITLE = 'FRC & FTC Flywheel Simulator | ReCalc';
const FLYWHEEL_NAME = 'Flywheel Calculator';
const FLYWHEEL_DESCRIPTION =
  'Simulate flywheel mechanisms for FRC and FTC robots. Model spin-up time, energy storage, and motor performance under load.';

export function meta() {
  return [
    ...buildMeta({
      path: FLYWHEEL_PATH,
      title: FLYWHEEL_TITLE,
      description: FLYWHEEL_DESCRIPTION,
    }),
    {
      'script:ld+json': buildJsonLd(
        buildWebPage({
          url: pageUrl(FLYWHEEL_PATH),
          name: FLYWHEEL_NAME,
          description: FLYWHEEL_DESCRIPTION,
          breadcrumbLabel: FLYWHEEL_NAME,
        }),
        buildCalculatorApp({
          url: pageUrl(FLYWHEEL_PATH),
          name: FLYWHEEL_NAME,
          description: FLYWHEEL_DESCRIPTION,
        }),
      ),
    },
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
  ballInitialVelocity: MeasurementParam.withDefault(new Measurement(0, 'ft/s')),
  ballInitialSpin: MeasurementParam.withDefault(new Measurement(0, 'rpm')),
  shooterMode: StringParam.withDefault('single-hooded'),
  useCustomBallMoi: BooleanParam.withDefault(false),
  customBallMoi: MeasurementParam.withDefault(new Measurement(2.5, 'in2*lbs')),
  secondaryShooterDiameter: MeasurementParam.withDefault(
    new Measurement(4, 'in'),
  ),
  secondaryShooterWeight: MeasurementParam.withDefault(
    new Measurement(1, 'lb'),
  ),
  secondaryShooterToShooterRatio: RatioParam.withDefault(
    new Ratio(1, RatioType.REDUCTION),
  ),
  useCustomSecondaryShooterMoi: BooleanParam.withDefault(false),
  customSecondaryShooterMoi: MeasurementParam.withDefault(
    new Measurement(4.5, 'in2*lbs'),
  ),
  efficiency: NumberParam.withDefault(100),
  maximumComfortableStatorLimit: MeasurementParam.withDefault(
    new Measurement(80, 'A'),
  ),
  maximumComfortableSupplyLimit: MeasurementParam.withDefault(
    new Measurement(60, 'A'),
  ),
  qVelocity: MeasurementParam.withDefault(new Measurement(50, 'rpm')),
  rVolts: MeasurementParam.withDefault(new Measurement(12, 'V')),
  sensorDelay: MeasurementParam.withDefault(new Measurement(1, 'ms')),
  feedbackDt: MeasurementParam.withDefault(new Measurement(20, 'ms')),
};

const ShooterModeSchema = z.enum(['single-hooded', 'dual-shooter', 'compound']);

const CHART_CONFIG = {} as const;

function formatChartNumber(value: number): string {
  return value.toFixed(2);
}

function formatChartAxisNumber(value: number): string {
  return value.toFixed(0);
}

// Constructed lazily (not at module scope) so importing this route module
// never touches the `Worker` global — required for prerendering, where the
// route component is rendered in Node and `Worker` does not exist. Every
// call site below is inside a useEffect, so the getter is only ever invoked
// client-side.
function createWorker() {
  return new ComlinkWorker<typeof FlywheelWorker>(
    new URL('../lib/math/flywheel.worker', import.meta.url),
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

const optimizerPool =
  getPool<typeof FlywheelOptimizerWorker>(optimizerWorkerUrl);

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
  const [qVelocity, setQVelocity] = useState(queryParams.qVelocity);
  const [rVolts, setRVolts] = useState(queryParams.rVolts);
  const [sensorDelay, setSensorDelay] = useState(queryParams.sensorDelay);
  const [feedbackDt, setFeedbackDt] = useState(queryParams.feedbackDt);

  const [shooterMode, setShooterMode] = useState<ShooterMode>(
    ShooterModeSchema.catch('single-hooded').parse(queryParams.shooterMode),
  );
  const [useCustomBallMoi, setUseCustomBallMoi] = useState(
    queryParams.useCustomBallMoi,
  );
  const [customBallMoi, setCustomBallMoi] = useState(queryParams.customBallMoi);
  const [ballInitialVelocity, setBallInitialVelocity] = useState(
    queryParams.ballInitialVelocity,
  );
  const [ballInitialSpin, setBallInitialSpin] = useState(
    queryParams.ballInitialSpin,
  );
  const [secondaryShooterDiameter, setSecondaryShooterDiameter] = useState(
    queryParams.secondaryShooterDiameter,
  );
  const [secondaryShooterWeight, setSecondaryShooterWeight] = useState(
    queryParams.secondaryShooterWeight,
  );
  const [secondaryShooterToShooterRatio, setSecondaryShooterToShooterRatio] =
    useState(queryParams.secondaryShooterToShooterRatio);
  const [useCustomSecondaryShooterMoi, setUseCustomSecondaryShooterMoi] =
    useState(queryParams.useCustomSecondaryShooterMoi);
  const [customSecondaryShooterMoi, setCustomSecondaryShooterMoi] = useState(
    queryParams.customSecondaryShooterMoi,
  );

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

  const derivedBallMOI = useMemo(
    () =>
      projectileWeight
        .mul(projectileDiameter.div(2).mul(projectileDiameter.div(2)))
        .mul(2 / 5),
    [projectileWeight, projectileDiameter],
  );

  const usableBallMOI = useMemo(
    () => (useCustomBallMoi ? customBallMoi : derivedBallMOI),
    [useCustomBallMoi, customBallMoi, derivedBallMOI],
  );

  const derivedSecondaryShooterMOI = useMemo(
    () =>
      secondaryShooterWeight
        .mul(
          secondaryShooterDiameter.div(2).mul(secondaryShooterDiameter.div(2)),
        )
        .div(2),
    [secondaryShooterWeight, secondaryShooterDiameter],
  );

  const usableSecondaryShooterMOI = useMemo(
    () =>
      useCustomSecondaryShooterMoi
        ? customSecondaryShooterMoi
        : derivedSecondaryShooterMOI,
    [
      useCustomSecondaryShooterMoi,
      customSecondaryShooterMoi,
      derivedSecondaryShooterMOI,
    ],
  );

  // Combined MOI of the shooter + flywheel assembly (load-side, before gearing).
  // This is what FlywheelSim expects — it handles the motor-to-load gearing
  // internally via its plant model.
  const combinedMOI = useMemo(() => {
    let total = usableShooterMOI;
    if (flywheelEnabled) {
      const r = flywheelToShooterRatio.asNumber();
      total = total.add(usableFlywheelMOI.div(r === 0 ? 1 : r * r));
    }
    if (shooterMode === 'dual-shooter' || shooterMode === 'compound') {
      const r = secondaryShooterToShooterRatio.asNumber();
      total = total.add(usableSecondaryShooterMOI.div(r === 0 ? 1 : r * r));
    }
    return total;
  }, [
    usableShooterMOI,
    flywheelEnabled,
    usableFlywheelMOI,
    flywheelToShooterRatio,
    shooterMode,
    usableSecondaryShooterMOI,
    secondaryShooterToShooterRatio,
  ]);

  // Effective MOI reflected to the motor shaft (for display only).
  const effectiveMOI = useMemo(
    () =>
      ratio.asNumber() === 0
        ? new Measurement(0, 'in2*lbs')
        : combinedMOI.div(Math.pow(ratio.asNumber(), 2)).to('in2*lbs'),
    [combinedMOI, ratio],
  );

  const [feedforwardGains, setFeedforwardGains] = useState({
    kV: new Measurement(0, 'V*s/rad'),
    kA: new Measurement(0, 'V*s^2/rad'),
  });

  useEffect(() => {
    getWorker()
      .computeFlywheelFeedforwardGains(
        motor.toDict(),
        ratio.toDict(),
        combinedMOI.toDict(),
        efficiency / 100,
      )
      .then(({ kV, kA }) => {
        setFeedforwardGains({
          kV: new Measurement(kV, 'V*s/rad'),
          kA: new Measurement(kA, 'V*s^2/rad'),
        });
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [motor, ratio, combinedMOI, efficiency]);

  const [feedbackGains, setFeedbackGains] = useState({
    kP: new Measurement(0, 'V*s/rad'),
  });

  useEffect(() => {
    getWorker()
      .computeFlywheelFeedbackGains(
        motor.toDict(),
        ratio.toDict(),
        combinedMOI.toDict(),
        efficiency / 100,
        qVelocity.toDict(),
        rVolts.toDict(),
        feedbackDt.toDict(),
        sensorDelay.toDict(),
      )
      .then(({ kP }) => {
        setFeedbackGains({ kP: new Measurement(kP, 'V*s/rad') });
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [
    motor,
    ratio,
    combinedMOI,
    efficiency,
    qVelocity,
    rVolts,
    feedbackDt,
    sensorDelay,
  ]);

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

  const shotAnalysis = useMemo(() => {
    if (workerWpilibSimStates.length === 0) return null;

    const needsSecondary =
      shooterMode === 'dual-shooter' || shooterMode === 'compound';
    return computeShotResult({
      mode: shooterMode,
      flywheelOmega: clampedShooterTargetSpeed,
      shooterRadius: shooterDiameter.div(2),
      combinedMOI,
      ballMass: projectileWeight,
      ballRadius: projectileDiameter.div(2),
      ballMOI: usableBallMOI,
      ballInitialVelocity,
      ballInitialSpin,
      secondaryRadius: needsSecondary
        ? secondaryShooterDiameter.div(2)
        : undefined,
      secondaryToShooterRatio: needsSecondary
        ? secondaryShooterToShooterRatio.inverse().asNumber()
        : undefined,
    });
  }, [
    workerWpilibSimStates,
    shooterMode,
    clampedShooterTargetSpeed,
    shooterDiameter,
    projectileDiameter,
    projectileWeight,
    combinedMOI,
    usableBallMOI,
    ballInitialVelocity,
    ballInitialSpin,
    secondaryShooterDiameter,
    secondaryShooterToShooterRatio,
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

  const spinupTimedOut = useMemo(() => {
    if (workerWpilibSimStates.length === 0) return false;
    const last = workerWpilibSimStates[workerWpilibSimStates.length - 1];
    return !last.success;
  }, [workerWpilibSimStates]);

  useEffect(() => {
    let cancelled = false;
    startCalculating(async () => {
      try {
        const states = await getWorker().simulateFlywheelWpilib(
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
      return undefined;
    }
    let cancelled = false;
    startRecoveryCalculating(async () => {
      try {
        const states = await getWorker().simulateFlywheelWpilib(
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
  const [configOptResult, setConfigOptResult] =
    useState<ConfigOptOutput | null>(null);
  const configOptGeneration = useRef(0);
  const [selectedConfigCell, setSelectedConfigCell] =
    useState<ConfigOptResult | null>(null);

  const userStatorAmps = statorLimit.to('A').scalar;
  const userSupplyAmps = supplyLimit.to('A').scalar;

  useEffect(() => {
    if (!optimizationEnabled) {
      setConfigOptResult(null);
      setSelectedConfigCell(null);
      return;
    }
    const gen = ++configOptGeneration.current;
    setConfigOptResult(null);
    setSelectedConfigCell(null);

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
      ])
      .then((result: ConfigOptOutput) => {
        if (gen !== configOptGeneration.current) return;
        setConfigOptResult(result);
        setSelectedConfigCell(result.recommended ?? null);
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
    ballInitialVelocity,
    ballInitialSpin,
    shooterMode,
    useCustomBallMoi,
    customBallMoi,
    secondaryShooterDiameter,
    secondaryShooterWeight,
    secondaryShooterToShooterRatio,
    useCustomSecondaryShooterMoi,
    customSecondaryShooterMoi,
    efficiency,
    maximumComfortableStatorLimit,
    maximumComfortableSupplyLimit,
    qVelocity,
    rVolts,
    sensorDelay,
    feedbackDt,
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
          <div className="flex min-w-75 flex-1 flex-col">
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

              {/* LQR Tuning section */}
              <Collapsible defaultOpen={false} className="flex flex-col p-4">
                <CollapsibleTrigger className="group flex cursor-pointer items-center gap-1">
                  <ChevronDownIcon className="size-3.5 -rotate-90 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-0" />
                  <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    LQR Tuning
                  </h2>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up">
                  <div className="flex flex-col gap-3 pt-3">
                    <IOLine>
                      <MeasurementInput
                        stateHook={[qVelocity, setQVelocity]}
                        label="Q Velocity"
                        tooltip="Maximum tolerable velocity error (Bryson's rule). Smaller values make the controller more aggressive about correcting velocity error."
                        testId="qVelocity"
                        labelAbove
                      />
                      <MeasurementInput
                        stateHook={[rVolts, setRVolts]}
                        label="R (Volts)"
                        tooltip="Maximum tolerable control effort in volts (Bryson's rule). Larger values reduce aggressiveness and limit output voltage."
                        testId="rVolts"
                        labelAbove
                      />
                    </IOLine>
                    <IOLine>
                      <MeasurementInput
                        stateHook={[sensorDelay, setSensorDelay]}
                        label="Sensor Delay"
                        tooltip="The delay time for the sensor. This is used to compensate for the sensor delay."
                        testId="sensorDelay"
                        labelAbove
                      />
                      <MeasurementInput
                        stateHook={[feedbackDt, setFeedbackDt]}
                        label="Control Loop Period"
                        tooltip="The period of the control loop that will run the PID controller (e.g. the main robot loop, or a faster onboard motor controller loop). Used to compute the discrete-time Feedback Gains below."
                        testId="feedbackDt"
                        labelAbove
                      />
                    </IOLine>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <div className="border-t" />

              {/* Shooter Wheel */}
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Shooter Wheel
                  </h2>
                  <StringSelectInput
                    stateHook={[
                      shooterMode,
                      (v) =>
                        setShooterMode(
                          ShooterModeSchema.catch('single-hooded').parse(v),
                        ),
                    ]}
                    label="Type"
                    choices={[
                      {
                        label: 'Single Shooter Wheel + Hood',
                        value: 'single-hooded',
                      },
                      { label: 'Dual Shooter Wheel', value: 'dual-shooter' },
                      {
                        label: 'Compound (Single + Dual)',
                        value: 'compound',
                      },
                    ]}
                    testId="shooterMode"
                    triggerClassName="w-auto"
                  />
                </div>
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

              {/* Secondary Shooter Wheel */}
              {shooterMode === 'dual-shooter' || shooterMode === 'compound' ? (
                <>
                  <div className="flex flex-col gap-3 p-4">
                    <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Secondary Shooter Wheel
                    </h2>
                    <IOLine>
                      <MeasurementInput
                        stateHook={[
                          secondaryShooterDiameter,
                          setSecondaryShooterDiameter,
                        ]}
                        label="Secondary Shooter Diameter"
                        testId="secondaryShooterDiameter"
                        labelAbove
                      />
                      <MeasurementInput
                        stateHook={[
                          secondaryShooterWeight,
                          setSecondaryShooterWeight,
                        ]}
                        label="Secondary Shooter Weight"
                        testId="secondaryShooterWeight"
                        labelAbove
                      />
                    </IOLine>
                    <IOLine>
                      <RatioInput
                        label="Secondary to Primary Ratio"
                        stateHook={[
                          secondaryShooterToShooterRatio,
                          setSecondaryShooterToShooterRatio,
                        ]}
                        testId="secondaryShooterToShooterRatio"
                        labelAbove
                      />
                    </IOLine>
                    <div className="flex flex-row flex-wrap items-end gap-x-4 md:flex-nowrap">
                      <div className="flex-1">
                        {useCustomSecondaryShooterMoi ? (
                          <MeasurementInput
                            stateHook={[
                              customSecondaryShooterMoi,
                              setCustomSecondaryShooterMoi,
                            ]}
                            label="Custom Secondary Shooter MOI"
                            disabled={() => !useCustomSecondaryShooterMoi}
                            testId="customSecondaryShooterMoi"
                            labelAbove
                          />
                        ) : (
                          <MeasurementOutput
                            state={derivedSecondaryShooterMOI}
                            label="Secondary Shooter MOI"
                            defaultUnit="in2*lbs"
                            testId="derivedSecondaryShooterMoi"
                            labelAbove
                          />
                        )}
                      </div>
                      <div className="flex h-9 flex-1 items-center">
                        <BooleanInput
                          stateHook={[
                            useCustomSecondaryShooterMoi,
                            setUseCustomSecondaryShooterMoi,
                          ]}
                          label="Use Custom Secondary Shooter MOI"
                          testId="useCustomSecondaryShooterMoi"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border-t" />
                </>
              ) : null}

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
                <IOLine>
                  <MeasurementInput
                    stateHook={[ballInitialVelocity, setBallInitialVelocity]}
                    label="Ball Initial Velocity"
                    testId="ballInitialVelocity"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[ballInitialSpin, setBallInitialSpin]}
                    label="Ball Initial Spin"
                    testId="ballInitialSpin"
                    labelAbove
                  />
                </IOLine>
                <div className="flex flex-row flex-wrap items-end gap-x-4 md:flex-nowrap">
                  <div className="flex-1">
                    {useCustomBallMoi ? (
                      <MeasurementInput
                        stateHook={[customBallMoi, setCustomBallMoi]}
                        label="Custom Ball MOI"
                        disabled={() => !useCustomBallMoi}
                        testId="customBallMoi"
                        labelAbove
                      />
                    ) : (
                      <MeasurementOutput
                        state={derivedBallMOI}
                        label="Ball MOI"
                        defaultUnit="in2*lbs"
                        testId="derivedBallMoi"
                        labelAbove
                      />
                    )}
                  </div>
                  <div className="flex h-9 flex-1 items-center">
                    <BooleanInput
                      stateHook={[useCustomBallMoi, setUseCustomBallMoi]}
                      label="Use Custom Ball MOI"
                      testId="useCustomBallMoi"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right column: outputs + chart */}
          <div className="flex min-w-75 flex-1 flex-col gap-4">
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
              {spinupTimedOut && (
                <div className="px-4 pb-4">
                  <Alert variant="destructive">
                    <TriangleAlertIcon />
                    <AlertTitle>Setpoint not reached</AlertTitle>
                    <AlertDescription>
                      The system could not reach the target speed within{' '}
                      {FLYWHEEL_SIMULATION_TIMEOUT_SECONDS} seconds. Try
                      increasing current limits, reducing the target speed,
                      changing the ratios, or adding more motors.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <div className="border-t" />

              {/* Simulation chart */}
              <div className="p-4 pb-2">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Simulation
                </h2>
                <ChartContainer
                  config={CHART_CONFIG}
                  className="min-h-50 w-full"
                  data-testid="chart"
                >
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 5, bottom: 20, left: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timeSeconds"
                      tickFormatter={(v: number) => formatChartNumber(v)}
                      label={{
                        value: 'Time (s)',
                        position: 'insideBottom',
                        offset: -15,
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(v: number) => formatChartAxisNumber(v)}
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
                      tickFormatter={(v: number) => formatChartAxisNumber(v)}
                      label={{
                        value: 'Angular Velocity (RPM)',
                        angle: 90,
                        position: 'insideRight',
                        offset: 15,
                        style: { textAnchor: 'middle' },
                      }}
                    />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === 'number' && Number.isFinite(value)
                          ? formatChartNumber(value)
                          : String(value)
                      }
                      labelFormatter={(label) =>
                        typeof label === 'number' && Number.isFinite(label)
                          ? formatChartNumber(label)
                          : label
                      }
                    />
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
                  state={feedforwardGains.kV}
                  label="kV"
                  defaultUnit="V*s/rad"
                  testId="kV"
                />
                <MeasurementDisplayOutput
                  state={feedforwardGains.kA}
                  label="kA"
                  defaultUnit="V*s^2/rad"
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

              {/* Feedback Gain */}
              <div className="grid grid-cols-3 gap-2 p-4">
                <MeasurementDisplayOutput
                  state={feedbackGains.kP}
                  label="Feedback kP"
                  defaultUnit="V*s/rad"
                  roundTo={4}
                  testId="feedbackKP"
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
          <div className="flex flex-row flex-wrap gap-4">
            <div className="min-w-0 flex-1">
              <OptimalConfigGrid
                configOptResult={configOptResult}
                userStatorAmps={userStatorAmps}
                userSupplyAmps={userSupplyAmps}
                selectedCell={selectedConfigCell}
                onSelectCell={setSelectedConfigCell}
              />
            </div>
            <div className="flex w-64 shrink-0 flex-col gap-3">
              <section className="flex flex-col gap-3 rounded-lg border p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Settings
                </h2>
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
              {selectedConfigCell?.success && (
                <section className="flex flex-col gap-3 rounded-lg border p-4">
                  <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <div className="size-1.5 rounded-full bg-primary" />
                    Selected Config
                  </h2>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Stator</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {selectedConfigCell.statorLimitAmps}A
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Supply</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {selectedConfigCell.supplyLimitAmps}A
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Optimal Ratio
                      </p>
                      <p className="text-sm font-semibold text-primary tabular-nums">
                        {selectedConfigCell.optimalRatio.toFixed(2)}:1
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {selectedConfigCell.timeToGoalSeconds.toFixed(3)}s
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Peak Supply
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        {selectedConfigCell.peakCurrentAmps.toFixed(1)}A
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Energy</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {selectedConfigCell.energyJoules.toFixed(1)}J
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Power</p>
                      <p className="text-sm font-semibold tabular-nums">
                        {selectedConfigCell.timeToGoalSeconds > 0
                          ? (
                              selectedConfigCell.energyJoules /
                              selectedConfigCell.timeToGoalSeconds
                            ).toFixed(1)
                          : '—'}
                        W
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
