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
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import { MotorInput } from '~/components/recalc/io/motor';
import NumberInput from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { ChartContainer } from '~/components/ui/chart';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { supplyLimitToStatorLimit } from '~/lib/math/common';
import type * as FlywheelWorker from '~/lib/math/flywheel.worker';
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
  withDefault,
} from '~/lib/types/queryParams';

export function meta() {
  return [
    { title: 'Flywheel Calculator' },
    { name: 'description', content: 'Flywheel Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  motor: withDefault(MotorParam, Motor.KrakenX60sFOC(2)),
  ratio: withDefault(RatioParam, new Ratio(1, RatioType.REDUCTION)),
  statorLimit: withDefault(MeasurementParam, new Measurement(30, 'A')),
  supplyLimit: withDefault(MeasurementParam, new Measurement(90, 'A')),
  supplyVoltage: withDefault(MeasurementParam, new Measurement(12.6, 'V')),
  batteryResistance: withDefault(
    MeasurementParam,
    new Measurement(0.015, 'Ohm'),
  ),
  shooterDiameter: withDefault(MeasurementParam, new Measurement(6, 'in')),
  shooterWeight: withDefault(MeasurementParam, new Measurement(1, 'lb')),
  shooterTargetSpeed: withDefault(
    MeasurementParam,
    new Measurement(3000, 'rpm'),
  ),
  customShooterMoi: withDefault(
    MeasurementParam,
    new Measurement(4.5, 'in2*lbs'),
  ),
  useCustomShooterMoi: withDefault(BooleanParam, false),
  flywheelDiameter: withDefault(MeasurementParam, new Measurement(4, 'in')),
  flywheelWeight: withDefault(MeasurementParam, new Measurement(1.5, 'lb')),
  customFlywheelMoi: withDefault(
    MeasurementParam,
    new Measurement(3, 'in2*lbs'),
  ),
  useCustomFlywheelMoi: withDefault(BooleanParam, false),
  flywheelToShooterRatio: withDefault(
    RatioParam,
    new Ratio(1, RatioType.REDUCTION),
  ),
  projectileDiameter: withDefault(MeasurementParam, new Measurement(4, 'in')),
  projectileWeight: withDefault(MeasurementParam, new Measurement(0.5, 'lb')),
  efficiency: withDefault(NumberParam, 100),
};

const worker = new ComlinkWorker<typeof FlywheelWorker>(
  new URL('../lib/math/flywheel.worker', import.meta.url),
  {
    type: 'module',
  },
);

type WpilibFlywheelSimState = FlywheelWorker.WpilibFlywheelSimState;

export default function Flywheel() {
  const queryParams = useQueryParams<{
    motor: Motor;
    ratio: Ratio;
    statorLimit: Measurement;
    supplyLimit: Measurement;
    supplyVoltage: Measurement;
    batteryResistance: Measurement;
    shooterDiameter: Measurement;
    shooterWeight: Measurement;
    shooterTargetSpeed: Measurement;
    customShooterMoi: Measurement;
    useCustomShooterMoi: boolean;
    flywheelDiameter: Measurement;
    flywheelWeight: Measurement;
    customFlywheelMoi: Measurement;
    useCustomFlywheelMoi: boolean;
    flywheelToShooterRatio: Ratio;
    projectileDiameter: Measurement;
    projectileWeight: Measurement;
    efficiency: number;
  }>(DEFAULT_PARAMS);

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
    () => shooterWeight.mul(shooterDiameter.div(2).mul(shooterDiameter.div(2))),
    [shooterWeight, shooterDiameter],
  );

  const derivedFlywheelMOI = useMemo(
    () =>
      flywheelWeight.mul(flywheelDiameter.div(2).mul(flywheelDiameter.div(2))),
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

  const totalMomentOfInertia = useMemo(
    () =>
      ratio.asNumber() === 0
        ? new Measurement(0, 'in2*lbs')
        : usableShooterMOI
            .add(
              usableFlywheelMOI.div(
                flywheelToShooterRatio.asNumber() == 0
                  ? 1
                  : Math.pow(flywheelToShooterRatio.asNumber(), 2),
              ),
            )
            .div(ratio.asNumber())
            .to('in2*lbs'),
    [usableShooterMOI, usableFlywheelMOI, flywheelToShooterRatio, ratio],
  );

  const supplyLimitInStatorTerms = useMemo(
    () =>
      supplyLimitToStatorLimit({
        supplyLimit,
        supplyVoltage: nominalVoltage,
        statorVoltage: nominalVoltage,
      }),
    [supplyLimit],
  );

  const isUsingStatorLimit = useMemo(
    () => supplyLimitInStatorTerms.gt(statorLimit),
    [supplyLimitInStatorTerms, statorLimit],
  );

  const limitingCurrentLimit = useMemo(
    () => (isUsingStatorLimit ? statorLimit : supplyLimitInStatorTerms),
    [isUsingStatorLimit, statorLimit, supplyLimitInStatorTerms],
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
      new MotorRules(motor, limitingCurrentLimit, {
        voltage: nominalVoltage,
        rpm: new Measurement(0, 'rpm'),
      })
        .solve()
        .torque.mul(motor.quantity)
        .mul(ratio.asNumber())
        .mul(efficiency / 100),
      shooterDiameter.div(2),
      totalMomentOfInertia.div(
        shooterDiameter.div(2).mul(shooterDiameter.div(2)),
      ),
    );
  }, [
    shooterDiameter,
    motor,
    limitingCurrentLimit,
    ratio,
    efficiency,
    totalMomentOfInertia,
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

  const spinupTime = useMemo(() => {
    return workerWpilibSimStates.length > 0
      ? new Measurement(
          workerWpilibSimStates[workerWpilibSimStates.length - 1].timeSeconds,
          's',
        )
      : new Measurement(0, 's');
  }, [workerWpilibSimStates]);

  useEffect(() => {
    worker
      .simulateFlywheelWpilib(
        motor.toDict(),
        ratio.toDict(),
        limitingCurrentLimit.toDict(),
        nominalVoltage.toDict(),
        supplyVoltage.toDict(),
        batteryResistance.toDict(),
        totalMomentOfInertia.toDict(),
        clampedShooterTargetSpeed.toDict(),
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
    limitingCurrentLimit,
    supplyVoltage,
    batteryResistance,
    totalMomentOfInertia,
    clampedShooterTargetSpeed,
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
                  state={totalMomentOfInertia}
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
          config={{}}
          className="min-h-[200px] w-full"
          data-testid="chart"
        >
          <LineChart data={workerWpilibSimStates}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timeSeconds" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
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
            <Tooltip />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
