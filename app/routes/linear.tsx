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
import { OptimalConfigGrid } from '~/components/recalc/optimalConfigGrid';
import { ChartContainer } from '~/components/ui/chart';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { Skeleton } from '~/components/ui/skeleton';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import { calculateGuessedLimits, calculateStallLoad } from '~/lib/math/linear';
import type * as LinearWorker from '~/lib/math/linear.worker';
import { orchestrateConfigOptimization } from '~/lib/math/linearConfigOrchestrator';
import type * as LinearOptimizerWorker from '~/lib/math/linearOptimizer.worker';
import type {
  ConfigOptOutput,
  ConfigOptResult,
  OptimizeConfigurationParams,
} from '~/lib/math/linearOptimizer.worker';
import optimizerWorkerUrl from '~/lib/math/linearOptimizer.worker?worker&url';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { getPool } from '~/lib/pool';
import { buildMeta, pageUrl } from '~/lib/seo';
import {
  BooleanParam,
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioParam,
} from '~/lib/types/queryParams';

const LINEAR_PATH = '/linear';
const LINEAR_TITLE = 'FRC & FTC Linear Mechanism Calculator | ReCalc';
const LINEAR_NAME = 'Linear Mechanism Calculator';
const LINEAR_DESCRIPTION =
  'Calculate linear mechanism performance for FRC and FTC robots. Model elevator and linear slide mechanisms with motor and gearbox selection.';

export function meta() {
  return [
    ...buildMeta({
      path: LINEAR_PATH,
      title: LINEAR_TITLE,
      description: LINEAR_DESCRIPTION,
    }),
    {
      'script:ld+json': buildJsonLd(
        buildWebPage({
          url: pageUrl(LINEAR_PATH),
          name: LINEAR_NAME,
          description: LINEAR_DESCRIPTION,
          breadcrumbLabel: LINEAR_NAME,
        }),
        buildCalculatorApp({
          url: pageUrl(LINEAR_PATH),
          name: LINEAR_NAME,
          description: LINEAR_DESCRIPTION,
        }),
      ),
    },
  ];
}

const CASCADE_TRAVEL_FACTOR = 0.5;
const BATTERY_VOLTAGE_FILTER_TC_S = 0.1;

type WpilibElevatorSimState = LinearWorker.WpilibElevatorSimState;

const DEFAULT_PARAMS = {
  motor: MotorParam.withDefault(Motor.KrakenX60sFOC(1)),
  travelDistance: MeasurementParam.withDefault(new Measurement(60, 'in')),
  spoolDiameter: MeasurementParam.withDefault(new Measurement(1, 'in')),
  load: MeasurementParam.withDefault(new Measurement(5, 'lb')),
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
  sensorDelay: MeasurementParam.withDefault(new Measurement(1, 'ms')),
  feedbackDt: MeasurementParam.withDefault(new Measurement(20, 'ms')),
  kalmanFilterPositionStdDev: MeasurementParam.withDefault(
    new Measurement(2, 'in'),
  ),
  kalmanFilterVelocityStdDev: MeasurementParam.withDefault(
    new Measurement(40, 'in/s'),
  ),
  kalmanFilterEncoderPositionStdDev: MeasurementParam.withDefault(
    new Measurement(0.001, 'in'),
  ),
};

// Constructed lazily (not at module scope) so importing this route module
// never touches the `Worker` global — required for prerendering, where the
// route component is rendered in Node and `Worker` does not exist. Every
// call site below is inside a useEffect, so the getter is only ever invoked
// client-side.
function createWorker() {
  return new ComlinkWorker<typeof LinearWorker>(
    new URL('../lib/math/linear.worker', import.meta.url),
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

const optimizerPool = getPool<typeof LinearOptimizerWorker>(optimizerWorkerUrl);

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
  const [feedbackDt, setFeedbackDt] = useState(queryParams.feedbackDt);
  const [kalmanFilterPositionStdDev, setKalmanFilterPositionStdDev] = useState(
    queryParams.kalmanFilterPositionStdDev,
  );
  const [kalmanFilterVelocityStdDev, setKalmanFilterVelocityStdDev] = useState(
    queryParams.kalmanFilterVelocityStdDev,
  );
  const [
    kalmanFilterEncoderPositionStdDev,
    setKalmanFilterEncoderPositionStdDev,
  ] = useState(queryParams.kalmanFilterEncoderPositionStdDev);

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
        rVolts,
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
      rVolts,
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

  const [selectedConfigCell, setSelectedConfigCell] =
    useState<ConfigOptResult | null>(null);

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

  const [feedforwardGains, setFeedforwardGains] = useState({
    kV: new Measurement(0, 'V*s/m'),
    kA: new Measurement(0, 'V*s^2/m'),
    kG: new Measurement(0, 'V'),
  });

  useEffect(() => {
    getWorker()
      .computeElevatorFeedforwardGains({
        motorDict: motor.toDict(),
        ratio: ratio.toDict(),
        load: load.toDict(),
        spoolDiameter: spoolDiameter.toDict(),
        efficiency: efficiency / 100,
        angle: angle.toDict(),
      })
      .then(({ kV, kA, kG }) => {
        setFeedforwardGains({
          kV: new Measurement(kV, 'V*s/m'),
          kA: new Measurement(kA, 'V*s^2/m'),
          kG: new Measurement(kG, 'V'),
        });
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [motor, ratio, load, spoolDiameter, efficiency, angle]);

  const { kV, kA, kG } = feedforwardGains;

  const [feedbackGains, setFeedbackGains] = useState({
    kP: new Measurement(0, 'V/m'),
    kD: new Measurement(0, 'V*s/m'),
  });

  useEffect(() => {
    getWorker()
      .computeElevatorFeedbackGains({
        motorDict: motor.toDict(),
        ratio: ratio.toDict(),
        load: load.toDict(),
        spoolDiameter: spoolDiameter.toDict(),
        efficiency: efficiency / 100,
        qPosition: qPosition.toDict(),
        qVelocity: qVelocity.toDict(),
        rVolts: rVolts.toDict(),
        feedbackDt: feedbackDt.toDict(),
        sensorDelay: sensorDelay.toDict(),
      })
      .then(({ kP, kD }) => {
        setFeedbackGains({
          kP: new Measurement(kP, 'V/m'),
          kD: new Measurement(kD, 'V*s/m'),
        });
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [
    motor,
    ratio,
    load,
    spoolDiameter,
    efficiency,
    qPosition,
    qVelocity,
    rVolts,
    feedbackDt,
    sensorDelay,
  ]);

  useEffect(() => {
    setIsSimulating(true);
    getWorker()
      .simulateElevatorWpilib({
        motorDict: motor.toDict(),
        ratio: ratio.toDict(),
        load: load.toDict(),
        spoolDiameter: spoolDiameter.toDict(),
        travelDistance: travelDistance.toDict(),
        statorLimitDict: statorLimit.toDict(),
        supplyLimitDict: supplyLimit.toDict(),
        batteryResistance: batteryResistance.toDict(),
        batteryVoltage: supplyVoltage.toDict(),
        angle: angle.toDict(),
        efficiency: efficiency / 100,
        cascade,
        batteryVoltageFilterTimeConstantSeconds: BATTERY_VOLTAGE_FILTER_TC_S,
        maxVelocityDict: effectiveMaxVelocity.toDict(),
        maxAccelerationDict: effectiveMaxAcceleration.toDict(),
        qPositionMeters: qPosition.to('m').scalar,
        qVelocityMPS: qVelocity.to('m/s').scalar,
        rVolts: rVolts.to('V').scalar,
        sensorDelaySeconds: sensorDelay.to('s').scalar,
        kalmanFilterPositionStdDev: kalmanFilterPositionStdDev.toDict(),
        kalmanFilterVelocityStdDev: kalmanFilterVelocityStdDev.toDict(),
        kalmanFilterEncoderPositionStdDev:
          kalmanFilterEncoderPositionStdDev.toDict(),
      })
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
    kalmanFilterPositionStdDev,
    kalmanFilterVelocityStdDev,
    kalmanFilterEncoderPositionStdDev,
  ]);

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

    const params: OptimizeConfigurationParams = {
      motorDict: motor.toDict(),
      loadDict: load.toDict(),
      spoolDiameterDict: spoolDiameter.toDict(),
      travelDistanceDict: travelDistance.toDict(),
      batteryResistanceDict: batteryResistance.toDict(),
      batteryVoltageDict: supplyVoltage.toDict(),
      maximumComfortableStatorLimitDict: maximumComfortableStatorLimit.toDict(),
      maximumComfortableSupplyLimitDict: maximumComfortableSupplyLimit.toDict(),
      angleDict: angle.toDict(),
      efficiency: efficiency / 100,
      cascade,
      batteryVoltageFilterTimeConstantSeconds: BATTERY_VOLTAGE_FILTER_TC_S,
      maxVelocityMPS: enableCustomMaxVelocity
        ? maxVelocity.to('m/s').scalar
        : null,
      maxAccelerationMPS2: enableCustomMaxAcceleration
        ? maxAcceleration.to('m/s^2').scalar
        : null,
      qPositionMeters: qPosition.to('m').scalar,
      qVelocityMPS: qVelocity.to('m/s').scalar,
      rVolts: rVolts.to('V').scalar,
      sensorDelaySeconds: sensorDelay.to('s').scalar,
      kalmanFilterPositionStdDevDict: kalmanFilterPositionStdDev.toDict(),
      kalmanFilterVelocityStdDevDict: kalmanFilterVelocityStdDev.toDict(),
      kalmanFilterEncoderPositionStdDevDict:
        kalmanFilterEncoderPositionStdDev.toDict(),
    };

    // Fan the stator x supply grid out across the worker pool instead of
    // running every cell serially in a single worker.
    orchestrateConfigOptimization(params, (statorAmps, supplyAmps) =>
      optimizerPool.exec('optimizeConfigurationCell', [
        { ...params, statorAmps, supplyAmps },
      ]),
    )
      .then((result: ConfigOptOutput) => {
        if (gen !== configOptGeneration.current) return;
        setConfigOptResult(result);
        setSelectedConfigCell(result.recommended ?? null);
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
    qPosition,
    qVelocity,
    rVolts,
    enableCustomMaxVelocity,
    enableCustomMaxAcceleration,
    maxVelocity,
    maxAcceleration,
    sensorDelay,
    kalmanFilterPositionStdDev,
    kalmanFilterVelocityStdDev,
    kalmanFilterEncoderPositionStdDev,
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
    feedbackDt,
    kalmanFilterPositionStdDev,
    kalmanFilterVelocityStdDev,
    kalmanFilterEncoderPositionStdDev,
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
          <div className="flex min-w-75 flex-1 flex-col">
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
                  <ChevronDownIcon className="size-3.5 -rotate-90 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-0" />
                  <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    LQR Tuning
                  </h2>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up">
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
                    <IOLine>
                      <MeasurementInput
                        stateHook={[feedbackDt, setFeedbackDt]}
                        label="Control Loop Period"
                        tooltip="The period of the control loop that will run the PID controller (e.g. the main robot loop, or a faster onboard motor controller loop). Used to compute the discrete-time Feedback Gains below."
                        testId="feedbackDt"
                        labelAbove
                      />
                    </IOLine>
                    <IOLine>
                      <MeasurementInput
                        stateHook={[
                          kalmanFilterPositionStdDev,
                          setKalmanFilterPositionStdDev,
                        ]}
                        label="Kalman Filter Position Std Dev"
                        tooltip="The standard deviation of the position error for the Kalman filter."
                        testId="kalmanFilterPositionStdDev"
                        labelAbove
                      />
                      <MeasurementInput
                        stateHook={[
                          kalmanFilterVelocityStdDev,
                          setKalmanFilterVelocityStdDev,
                        ]}
                        label="Kalman Filter Velocity Std Dev"
                        tooltip="The standard deviation of the velocity error for the Kalman filter."
                        testId="kalmanFilterVelocityStdDev"
                        labelAbove
                      />
                      <MeasurementInput
                        stateHook={[
                          kalmanFilterEncoderPositionStdDev,
                          setKalmanFilterEncoderPositionStdDev,
                        ]}
                        label="Kalman Filter Encoder Position Std Dev"
                        tooltip="The standard deviation of the encoder position error for the Kalman filter."
                        testId="kalmanFilterEncoderPositionStdDev"
                        labelAbove
                      />
                    </IOLine>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </section>
          </div>

          {/* Right column: outputs + chart */}
          <div className="flex min-w-75 flex-1 flex-col gap-4">
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
                  <Skeleton className="min-h-50 w-full rounded-md" />
                ) : (
                  <ChartContainer config={{}} className="min-h-50 w-full">
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
                      <Tooltip
                        formatter={(value) =>
                          typeof value === 'number' && Number.isFinite(value)
                            ? value.toFixed(3)
                            : String(value)
                        }
                        labelFormatter={(label) =>
                          typeof label === 'number' && Number.isFinite(label)
                            ? label.toFixed(3)
                            : String(label)
                        }
                      />
                      <Legend
                        verticalAlign="top"
                        wrapperStyle={{ paddingBottom: 20 }}
                      />
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
              <div className="border-t" />
              <div className="grid grid-cols-2 gap-2 p-4">
                <MeasurementDisplayOutput
                  state={feedbackGains.kP}
                  label="Feedback kP"
                  defaultUnit="V/m"
                  roundTo={3}
                  testId="feedbackKP"
                />
                <MeasurementDisplayOutput
                  state={feedbackGains.kD}
                  label="Feedback kD"
                  defaultUnit="V*s/m"
                  roundTo={3}
                  testId="feedbackKD"
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
          <div className="flex flex-row flex-wrap gap-4">
            {/* Optimal configuration grid */}
            <div className="min-w-0 flex-1">
              <OptimalConfigGrid
                configOptResult={configOptResult}
                userStatorAmps={userStatorAmps}
                userSupplyAmps={userSupplyAmps}
                selectedCell={selectedConfigCell}
                onSelectCell={setSelectedConfigCell}
              />
            </div>

            {/* Right column: settings + selected config */}
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
