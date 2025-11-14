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
import {
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import { MotorInput } from '~/components/recalc/io/motor';
import NumberInput from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
import { ChartContainer } from '~/components/ui/chart';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import type * as ArmWorker from '~/lib/math/arm.worker';
import { supplyLimitToStatorLimit } from '~/lib/math/common';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import {
  MeasurementParam,
  MotorParam,
  NumberParam,
  RatioParam,
  withDefault,
} from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Arm Calculator' },
    { name: 'description', content: 'Arm Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  motor: withDefault(MotorParam, Motor.KrakenX60sFOC(1)),
  ratio: withDefault(RatioParam, new Ratio(100, RatioType.REDUCTION)),
  statorLimit: withDefault(MeasurementParam, new Measurement(60, 'A')),
  supplyLimit: withDefault(MeasurementParam, new Measurement(90, 'A')),
  supplyVoltage: withDefault(MeasurementParam, new Measurement(12, 'V')),
  statorVoltage: withDefault(MeasurementParam, new Measurement(12, 'V')),
  batteryResistance: withDefault(
    MeasurementParam,
    new Measurement(0.015, 'Ohm'),
  ),
  armLength: withDefault(MeasurementParam, new Measurement(24, 'in')),
  minAngle: withDefault(MeasurementParam, new Measurement(0, 'deg')),
  maxAngle: withDefault(MeasurementParam, new Measurement(90, 'deg')),
  efficiency: withDefault(NumberParam, 100),
  load: withDefault(MeasurementParam, new Measurement(5, 'lb')),
};

const worker = new ComlinkWorker<typeof ArmWorker>(
  new URL('../lib/math/arm.worker', import.meta.url),
  {
    type: 'module',
  },
);

type WpilibArmSimState = ArmWorker.WpilibArmSimState;

export default function Arm() {
  const queryParams = useQueryParams<{
    motor: Motor;
    ratio: Ratio;
    statorLimit: Measurement;
    supplyLimit: Measurement;
    supplyVoltage: Measurement;
    statorVoltage: Measurement;
    batteryResistance: Measurement;
    armLength: Measurement;
    minAngle: Measurement;
    maxAngle: Measurement;
    efficiency: number;
    load: Measurement;
  }>(DEFAULT_PARAMS);

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

  const supplyLimitInStatorTerms = useMemo(
    () =>
      supplyLimitToStatorLimit({
        supplyLimit,
        supplyVoltage,
        statorVoltage,
      }),
    [supplyLimit, supplyVoltage, statorVoltage],
  );

  const isUsingStatorLimit = useMemo(
    () => supplyLimitInStatorTerms.gt(statorLimit),
    [supplyLimitInStatorTerms, statorLimit],
  );

  const statorPowerLimit = useMemo(
    () => statorVoltage.mul(statorLimit),
    [statorVoltage, statorLimit],
  );

  const supplyPowerLimit = useMemo(
    () => supplyVoltage.mul(supplyLimit),
    [supplyVoltage, supplyLimit],
  );

  const [goingUpStates, setGoingUpStates] = useState<WpilibArmSimState[]>([]);
  const [goingDownStates, setGoingDownStates] = useState<WpilibArmSimState[]>(
    [],
  );

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

  useEffect(() => {
    setGoingUpStates([]);
    setGoingDownStates([]);

    worker
      .simulateArmWpilib(
        motor.toDict(),
        ratio.toDict(),
        momentOfInertia.toDict(),
        armLength.toDict(),
        minAngle.toDict(),
        maxAngle.toDict(),
        minAngle.toDict(),
        statorVoltage.toDict(),
        supplyVoltage.toDict(),
        isUsingStatorLimit
          ? statorLimit.toDict()
          : supplyLimitInStatorTerms.toDict(),
        batteryResistance.toDict(),
        'up',
      )
      .then((states) => {
        setGoingUpStates(states);
      })
      .catch((error) => {
        console.error(error);
      });

    worker
      .simulateArmWpilib(
        motor.toDict(),
        ratio.toDict(),
        momentOfInertia.toDict(),
        armLength.toDict(),
        minAngle.toDict(),
        maxAngle.toDict(),
        maxAngle.toDict(),
        statorVoltage.toDict(),
        supplyVoltage.toDict(),
        isUsingStatorLimit
          ? statorLimit.toDict()
          : supplyLimitInStatorTerms.toDict(),
        batteryResistance.toDict(),
        'down',
      )
      .then((states) => {
        setGoingDownStates(states);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [
    motor,
    ratio,
    momentOfInertia,
    armLength,
    minAngle,
    maxAngle,
    supplyVoltage,
    statorLimit,
    supplyLimit,
    batteryResistance,
    isUsingStatorLimit,
    supplyLimitInStatorTerms,
    statorVoltage,
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

  return (
    <div>
      <CalcHeading
        title="Arm Calculator"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-row flex-wrap gap-x-4 px-1 *:flex-1">
        <div className="flex flex-col gap-x-4 gap-y-2">
          <IOLine>
            <MotorInput stateHook={[motor, setMotor]} />
            <RatioInput stateHook={[ratio, setRatio]} />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[armLength, setArmLength]}
              label="Arm Length"
              tooltip="The length of the arm from the motor to the center of the load."
            />
            <MeasurementInput
              stateHook={[load, setLoad]}
              label="Load"
              tooltip="The weight of the load."
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[minAngle, setMinAngle]}
              label="Min Angle"
              tooltip="The minimum angle the arm can move to."
            />
            <MeasurementInput
              stateHook={[maxAngle, setMaxAngle]}
              label="Max Angle"
              tooltip="The maximum angle the arm can move to."
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[statorLimit, setStatorLimit]}
              label="Stator Limit"
              tooltip="The current limit applied to the stator."
            />
            <MeasurementInput
              stateHook={[supplyLimit, setSupplyLimit]}
              label="Supply Limit"
              tooltip="The current limit applied to the supply (battery). This is *not* supported by REVLib, so make sure the supply power limit is higher than the stator power limit for REV motors."
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[statorVoltage, setStatorVoltage]}
              label="Stator Voltage"
              tooltip="The voltage applied to the stator."
            />
            <MeasurementInput
              stateHook={[supplyVoltage, setSupplyVoltage]}
              label="Supply Voltage"
              tooltip="The voltage available from the supply (battery) at rest."
            />
          </IOLine>

          <IOLine>
            <MeasurementOutput
              state={statorPowerLimit}
              label="Stator Power Limit"
              defaultUnit="W"
              roundTo={0}
            />
            <MeasurementOutput
              state={supplyPowerLimit}
              label="Supply Power Limit"
              defaultUnit="W"
              roundTo={0}
            />
          </IOLine>

          <IOLine>
            <NumberInput
              stateHook={[efficiency, setEfficiency]}
              label="Efficiency"
              tooltip="The efficiency of the arm and gearbox. Typically ~92-97% per stage."
            />
            <MeasurementInput
              stateHook={[batteryResistance, setBatteryResistance]}
              label="Battery Resistance"
              tooltip="The resistance of the battery."
            />
          </IOLine>

          <IOLine>
            <MeasurementOutput
              state={goingUpTimeToGoal}
              label="Time to Goal (Up)"
              defaultUnit="s"
            />
            <MeasurementOutput
              state={goingDownTimeToGoal}
              label="Time to Goal (Down)"
              defaultUnit="s"
            />
          </IOLine>
        </div>
        <div className="flex flex-col gap-x-4 gap-y-2">
          <ChartContainer config={{}} className="min-h-[200px] w-full">
            <LineChart data={goingUpStates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeSeconds" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                dataKey="angularVelocity"
                yAxisId="right"
                dot={false}
                stroke="blue"
              />
              <Line
                dataKey="currentDraw"
                yAxisId="left"
                dot={false}
                stroke="yellow"
              />
              <Line
                dataKey="batteryVoltage"
                yAxisId="left"
                dot={false}
                stroke="green"
              />
            </LineChart>
          </ChartContainer>

          <ChartContainer config={{}} className="min-h-[200px] w-full">
            <LineChart data={goingDownStates}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeSeconds" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                dataKey="angularVelocity"
                yAxisId="right"
                dot={false}
                stroke="blue"
              />
              <Line
                dataKey="currentDraw"
                yAxisId="left"
                dot={false}
                stroke="yellow"
              />
              <Line
                dataKey="batteryVoltage"
                yAxisId="left"
                dot={false}
                stroke="green"
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
