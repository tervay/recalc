import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { calculateKa, calculateKg, calculateKv } from '~/lib/math/kVkA';
import { calculateStallLoad } from '~/lib/math/linear';
import type * as LinearWorker from '~/lib/math/linear.worker';
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
  withDefault,
} from '~/lib/types/queryParams';

type WpilibElevatorSimState = LinearWorker.WpilibElevatorSimState;

export function meta() {
  return [
    { title: 'Linear Motion Calculator' },
    { name: 'description', content: 'Linear Motion Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  motor: withDefault(MotorParam, Motor.KrakenX60sFOC(1)),
  travelDistance: withDefault(MeasurementParam, new Measurement(60, 'in')),
  spoolDiameter: withDefault(MeasurementParam, new Measurement(1, 'in')),
  load: withDefault(MeasurementParam, new Measurement(15, 'lb')),
  ratio: withDefault(RatioParam, new Ratio(2, RatioType.REDUCTION)),
  efficiency: withDefault(NumberParam, 100),
  statorLimit: withDefault(MeasurementParam, new Measurement(60, 'A')),
  supplyLimit: withDefault(MeasurementParam, new Measurement(90, 'A')),
  supplyVoltage: withDefault(MeasurementParam, new Measurement(12, 'V')),
  statorVoltage: withDefault(MeasurementParam, new Measurement(12, 'V')),
  angle: withDefault(MeasurementParam, new Measurement(90, 'deg')),
  batteryResistance: withDefault(
    MeasurementParam,
    new Measurement(0.015, 'Ohm'),
  ),
  cascade: withDefault(BooleanParam, false),
};

const worker = new ComlinkWorker<typeof LinearWorker>(
  new URL('../lib/math/linear.worker', import.meta.url),
  {
    type: 'module',
  },
);

export default function Linear() {
  const queryParams = useQueryParams<{
    motor: Motor;
    travelDistance: Measurement;
    spoolDiameter: Measurement;
    load: Measurement;
    ratio: Ratio;
    efficiency: number;
    statorLimit: Measurement;
    supplyLimit: Measurement;
    supplyVoltage: Measurement;
    statorVoltage: Measurement;
    angle: Measurement;
    batteryResistance: Measurement;
    cascade: boolean;
  }>(DEFAULT_PARAMS);

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

  const timeToGoal = useMemo(() => {
    return new Measurement(
      workerWpilibSimStates.length > 0
        ? workerWpilibSimStates[workerWpilibSimStates.length - 1].timeSeconds
        : 0,
      's',
    );
  }, [workerWpilibSimStates]);

  useEffect(() => {
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
      })
      .catch((error) => {
        console.error(error);
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
  });

  return (
    <div>
      <CalcHeading
        title="Linear Motion Calculator"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-row flex-wrap gap-6 px-1">
        {/* Left column: inputs */}
        <div className="flex min-w-[300px] flex-1 flex-col gap-4">
          {/* Motor & Gearing section */}
          <section className="flex flex-col gap-3 rounded-lg border p-4">
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
          </section>

          {/* Load & Travel section */}
          <section className="flex flex-col gap-3 rounded-lg border p-4">
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
          </section>

          {/* Limits section */}
          <section className="flex flex-col gap-3 rounded-lg border p-4">
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
          </section>
        </div>

        {/* Right column: outputs + chart */}
        <div className="flex min-w-[300px] flex-1 flex-col gap-4">
          {/* Results grid */}
          <section className="flex flex-col gap-3 rounded-lg border p-4">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Results
            </h2>
            <div className="grid grid-cols-2 gap-2">
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
            </div>
            <div className="grid grid-cols-3 gap-2">
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
            </div>
          </section>

          {/* Chart */}
          <ChartContainer config={{}} className="min-h-[200px] w-full">
            <LineChart data={workerWpilibSimStates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeSeconds" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                dataKey="positionMeters"
                yAxisId="right"
                stroke="black"
                dot={false}
              />
              <Line
                dataKey="velocityMetersPerSecond"
                yAxisId="left"
                stroke="red"
                dot={false}
              />
              <Line
                dataKey="statorCurrentDrawAmps"
                yAxisId="left"
                stroke="goldenrod"
                dot={false}
              />
              <Line
                dataKey="supplyCurrentDrawAmps"
                yAxisId="left"
                stroke="purple"
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
