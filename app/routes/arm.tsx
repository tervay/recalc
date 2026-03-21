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
  statorLimit: MeasurementParam.withDefault(new Measurement(60, 'A')),
  supplyLimit: MeasurementParam.withDefault(new Measurement(90, 'A')),
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

const worker = new ComlinkWorker<typeof ArmWorker>(
  new URL('../lib/math/arm.worker', import.meta.url),
  {
    type: 'module',
  },
);

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

  useEffect(() => {
    setGoingUpStates([]);
    setGoingDownStates([]);
    setIsCalculating(true);
    let cancelled = false;
    let pending = 2;
    const done = () => {
      if (!cancelled && --pending === 0) setIsCalculating(false);
    };

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
        if (!cancelled) setGoingUpStates(states);
        done();
      })
      .catch((error) => {
        console.error(error);
        done();
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
        if (!cancelled) setGoingDownStates(states);
        done();
      })
      .catch((error) => {
        console.error(error);
        done();
      });

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
    <div data-testid="arm-page" data-calculating={String(isCalculating)}>
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
            <MeasurementOutput
              state={statorPowerLimit}
              label="Stator Power Limit"
              defaultUnit="W"
              roundTo={0}
              testId="statorPowerLimit"
            />
            <MeasurementOutput
              state={supplyPowerLimit}
              label="Supply Power Limit"
              defaultUnit="W"
              roundTo={0}
              testId="supplyPowerLimit"
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
