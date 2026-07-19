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
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import type * as ArmWorker from '~/lib/math/arm.worker';
import type * as ArmOptimizerWorker from '~/lib/math/armOptimizer.worker';
import type {
  ConfigOptOutput,
  ConfigOptResult,
} from '~/lib/math/armOptimizer.worker';
import optimizerWorkerUrl from '~/lib/math/armOptimizer.worker?worker&url';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { getPool } from '~/lib/pool';
import { buildMeta, pageUrl } from '~/lib/seo';
import {
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioParam,
} from '~/lib/types/queryParams';

const ARM_PATH = '/arm';
const ARM_TITLE = 'FRC & FTC Arm Calculator & Simulator | ReCalc';
const ARM_NAME = 'Arm Calculator';
const ARM_DESCRIPTION =
  'Simulate arm mechanisms for FRC and FTC robots. Model DC motor performance, gear ratios, and arm dynamics using WPILib state-space simulation.';

export function meta() {
  return [
    ...buildMeta({
      path: ARM_PATH,
      title: ARM_TITLE,
      description: ARM_DESCRIPTION,
    }),
    {
      'script:ld+json': buildJsonLd(
        buildWebPage({
          url: pageUrl(ARM_PATH),
          name: ARM_NAME,
          description: ARM_DESCRIPTION,
          breadcrumbLabel: ARM_NAME,
        }),
        buildCalculatorApp({
          url: pageUrl(ARM_PATH),
          name: ARM_NAME,
          description: ARM_DESCRIPTION,
        }),
      ),
    },
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
  maximumComfortableStatorLimit: MeasurementParam.withDefault(
    new Measurement(80, 'A'),
  ),
  maximumComfortableSupplyLimit: MeasurementParam.withDefault(
    new Measurement(60, 'A'),
  ),
  qPosition: MeasurementParam.withDefault(new Measurement(2, 'deg')),
  qVelocity: MeasurementParam.withDefault(new Measurement(40, 'deg/s')),
  rVolts: MeasurementParam.withDefault(new Measurement(12, 'V')),
  sensorDelay: MeasurementParam.withDefault(new Measurement(1, 'ms')),
  feedbackDt: MeasurementParam.withDefault(new Measurement(20, 'ms')),
};

const CHART_CONFIG = {} as const;

// Constructed lazily (not at module scope) so importing this route module
// never touches the `Worker` global — required for prerendering, where the
// route component is rendered in Node and `Worker` does not exist. Every
// call site below is inside a useEffect, so the getter is only ever invoked
// client-side.
function createWorker() {
  return new ComlinkWorker<typeof ArmWorker>(
    new URL('../lib/math/arm.worker', import.meta.url),
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

const optimizerPool = getPool<typeof ArmOptimizerWorker>(optimizerWorkerUrl);

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
  const [maximumComfortableStatorLimit, setMaximumComfortableStatorLimit] =
    useState(queryParams.maximumComfortableStatorLimit);
  const [maximumComfortableSupplyLimit, setMaximumComfortableSupplyLimit] =
    useState(queryParams.maximumComfortableSupplyLimit);
  const [qPosition, setQPosition] = useState(queryParams.qPosition);
  const [qVelocity, setQVelocity] = useState(queryParams.qVelocity);
  const [rVolts, setRVolts] = useState(queryParams.rVolts);
  const [sensorDelay, setSensorDelay] = useState(queryParams.sensorDelay);
  const [feedbackDt, setFeedbackDt] = useState(queryParams.feedbackDt);

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

  const [feedforwardGains, setFeedforwardGains] = useState({
    kV: new Measurement(0, 'V*s/rad'),
    kA: new Measurement(0, 'V*s^2/rad'),
    kG: new Measurement(0, 'V'),
  });

  useEffect(() => {
    getWorker()
      .computeArmFeedforwardGains(
        motor.toDict(),
        ratio.toDict(),
        momentOfInertia.toDict(),
        efficiency / 100,
        load.toDict(),
        armLength.toDict(),
      )
      .then(({ kV, kA, kG }) => {
        setFeedforwardGains({
          kV: new Measurement(kV, 'V*s/rad'),
          kA: new Measurement(kA, 'V*s^2/rad'),
          kG: new Measurement(kG, 'V'),
        });
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [motor, ratio, momentOfInertia, efficiency, load, armLength]);

  const [feedbackGains, setFeedbackGains] = useState({
    kP: new Measurement(0, 'V/rad'),
    kD: new Measurement(0, 'V*s/rad'),
  });

  useEffect(() => {
    getWorker()
      .computeArmFeedbackGains(
        motor.toDict(),
        ratio.toDict(),
        momentOfInertia.toDict(),
        efficiency / 100,
        qPosition.toDict(),
        qVelocity.toDict(),
        rVolts.toDict(),
        feedbackDt.toDict(),
        sensorDelay.toDict(),
      )
      .then(({ kP, kD }) => {
        setFeedbackGains({
          kP: new Measurement(kP, 'V/rad'),
          kD: new Measurement(kD, 'V*s/rad'),
        });
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [
    motor,
    ratio,
    momentOfInertia,
    efficiency,
    qPosition,
    qVelocity,
    rVolts,
    feedbackDt,
    sensorDelay,
  ]);

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

    const upPromise = getWorker().simulateArmWpilib(
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

    const downPromise = getWorker().simulateArmWpilib(
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
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const [configOptResult, setConfigOptResult] =
    useState<ConfigOptOutput | null>(null);
  const [selectedConfigCell, setSelectedConfigCell] =
    useState<ConfigOptResult | null>(null);
  const configOptGeneration = useRef(0);

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
        momentOfInertia.toDict(),
        armLength.toDict(),
        minAngle.toDict(),
        maxAngle.toDict(),
        statorVoltage.toDict(),
        batteryResistance.toDict(),
        supplyVoltage.toDict(),
        maximumComfortableStatorLimit.toDict(),
        maximumComfortableSupplyLimit.toDict(),
        efficiency / 100,
      ])
      .then((result: ConfigOptOutput) => {
        if (gen !== configOptGeneration.current) return;
        setConfigOptResult(result);
        setSelectedConfigCell(result.recommended ?? null);
      })
      .catch((err: unknown) => {
        console.error('Arm optimizer error:', err);
      });
  }, [
    motor,
    momentOfInertia,
    armLength,
    minAngle,
    maxAngle,
    statorVoltage,
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
    statorVoltage,
    batteryResistance,
    armLength,
    minAngle,
    maxAngle,
    efficiency,
    load,
    maximumComfortableStatorLimit,
    maximumComfortableSupplyLimit,
    qPosition,
    qVelocity,
    rVolts,
    sensorDelay,
    feedbackDt,
  });

  return (
    <div>
      <div data-testid="arm-main" data-calculating={String(isCalculating)}>
        <CalcHeading
          title="Arm Calculator"
          getSerializedState={() => serializedState}
        />
        <div className="flex flex-row flex-wrap gap-6 px-1">
          <div className="flex min-w-75 flex-1 flex-col">
            <section className="flex flex-col rounded-lg border">
              {/* Motor & Gearing section */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Motor &amp; Gearing
                </h2>
                <IOLine>
                  <MotorInput
                    stateHook={[motor, setMotor]}
                    testId="motor"
                    labelAbove
                  />
                  <RatioInput
                    stateHook={[ratio, setRatio]}
                    testId="ratio"
                    labelAbove
                  />
                </IOLine>
              </div>
              <div className="border-t" />

              {/* Arm Geometry section */}
              <div className="flex flex-col gap-3 p-4">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Arm Geometry
                </h2>
                <IOLine>
                  <MeasurementInput
                    stateHook={[armLength, setArmLength]}
                    label="Arm Length"
                    tooltip="The length of the arm from the motor to the center of the load."
                    testId="armLength"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[load, setLoad]}
                    label="Load"
                    tooltip="The weight of the load."
                    testId="load"
                    labelAbove
                  />
                </IOLine>
                <IOLine>
                  <MeasurementInput
                    stateHook={[minAngle, setMinAngle]}
                    label="Min Angle"
                    tooltip="The minimum angle the arm can move to."
                    testId="minAngle"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[maxAngle, setMaxAngle]}
                    label="Max Angle"
                    tooltip="The maximum angle the arm can move to."
                    testId="maxAngle"
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
                  <NumberInput
                    stateHook={[efficiency, setEfficiency]}
                    label="Efficiency"
                    tooltip="The efficiency of the arm and gearbox. Typically ~92-97% per stage."
                    testId="efficiency"
                    labelAbove
                  />
                  <MeasurementInput
                    stateHook={[batteryResistance, setBatteryResistance]}
                    label="Battery Resistance"
                    tooltip="The resistance of the battery."
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
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </section>
          </div>
          <div className="flex min-w-75 flex-1 flex-col gap-4">
            <section className="flex flex-col rounded-lg border">
              {/* Results */}
              <div className="grid grid-cols-2 gap-2 p-4">
                <MeasurementDisplayOutput
                  state={goingUpTimeToGoal}
                  label="Time to Goal (Up)"
                  defaultUnit="s"
                  testId="goingUpTimeToGoal"
                />
                <MeasurementDisplayOutput
                  state={goingDownTimeToGoal}
                  label="Time to Goal (Down)"
                  defaultUnit="s"
                  testId="goingDownTimeToGoal"
                />
              </div>
              <div className="border-t" />

              {/* Going Up chart */}
              <div className="p-4 pb-2">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Simulation (Going Up)
                </h2>
                <ChartContainer
                  config={CHART_CONFIG}
                  className="min-h-50 w-full"
                >
                  <LineChart
                    data={goingUpChartData}
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
                        value: 'Motor Speed (RPM)',
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

              {/* Going Down chart */}
              <div className="p-4 pb-2">
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Simulation (Going Down)
                </h2>
                <ChartContainer
                  config={CHART_CONFIG}
                  className="min-h-50 w-full"
                >
                  <LineChart
                    data={goingDownChartData}
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
                        value: 'Motor Speed (RPM)',
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

              {/* Feedforward */}
              <div className="grid grid-cols-3 gap-2 p-4">
                <MeasurementDisplayOutput
                  state={feedforwardGains.kV}
                  label="kV"
                  defaultUnit="V*s/rad"
                  roundTo={3}
                  testId="kV"
                />
                <MeasurementDisplayOutput
                  state={feedforwardGains.kA}
                  label="kA"
                  defaultUnit="V*s^2/rad"
                  roundTo={3}
                  testId="kA"
                />
                <MeasurementDisplayOutput
                  state={feedforwardGains.kG}
                  label="kG"
                  defaultUnit="V"
                  roundTo={3}
                  testId="kG"
                />
              </div>
              <div className="border-t" />

              {/* Feedback Gains */}
              <div className="grid grid-cols-2 gap-2 p-4">
                <MeasurementDisplayOutput
                  state={feedbackGains.kP}
                  label="Feedback kP"
                  defaultUnit="V/rad"
                  roundTo={3}
                  testId="feedbackKP"
                />
                <MeasurementDisplayOutput
                  state={feedbackGains.kD}
                  label="Feedback kD"
                  defaultUnit="V*s/rad"
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
