import { minBy } from 'lodash-es';
import { useMemo, useState } from 'react';
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
import Divider from '~/components/recalc/divider';
import BooleanInput from '~/components/recalc/io/boolean';
import {
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import { MotorInput } from '~/components/recalc/io/motor';
import NumberInput from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
import { ChartContainer } from '~/components/ui/chart';
import { useQueryParams } from '~/lib/hooks';
import { calculateLoadedBatteryVoltage } from '~/lib/math/batterySim';
import { supplyLimitToStatorLimit } from '~/lib/math/common';
import { calculateKa, calculateKv } from '~/lib/math/kVkA';
import { generateProfile } from '~/lib/math/sheetExponentialProfile';
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
    flywhweelToShooterRatio: Ratio;
    projectileDiameter: Measurement;
    projectileWeight: Measurement;
    efficiency: number;
  }>({
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
    flywhweelToShooterRatio: withDefault(
      RatioParam,
      new Ratio(1, RatioType.REDUCTION),
    ),
    projectileDiameter: withDefault(MeasurementParam, new Measurement(4, 'in')),
    projectileWeight: withDefault(MeasurementParam, new Measurement(0.5, 'lb')),
    efficiency: withDefault(NumberParam, 100),
  });

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
  const [flywhweelToShooterRatio, setFlywhweelToShooterRatio] = useState(
    queryParams.flywhweelToShooterRatio,
  );
  const [_projectileDiameter] = useState(queryParams.projectileDiameter);
  const [projectileWeight, setProjectileWeight] = useState(
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
                flywhweelToShooterRatio.asNumber() == 0
                  ? 1
                  : Math.pow(flywhweelToShooterRatio.asNumber(), 2),
              ),
            )
            .div(ratio.asNumber())
            .to('in2*lbs'),
    [usableShooterMOI, usableFlywheelMOI, flywhweelToShooterRatio, ratio],
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
    if (flywheelDiameter.scalar == 0) {
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
      flywheelDiameter.div(2),
      totalMomentOfInertia.div(
        flywheelDiameter.div(2).mul(flywheelDiameter.div(2)),
      ),
    );
  }, [
    flywheelDiameter,
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

  const sheetData = useMemo(
    () =>
      generateProfile(
        new Measurement(100000, 'in'),
        new Measurement(100000, 'in/s'),
        motor,
        efficiency,
        ratio,
        totalMomentOfInertia
          .to('kg m2')
          .div(shooterDiameter.div(2).mul(shooterDiameter.div(2))),
        limitingCurrentLimit,
        new Measurement(0, 'm/s^2'),
        shooterDiameter,
        clampedShooterTargetSpeed.mul(shooterDiameter.div(2)).removeRad(),
      ),
    [
      motor,
      efficiency,
      ratio,
      limitingCurrentLimit,
      shooterDiameter,
      clampedShooterTargetSpeed,
      totalMomentOfInertia,
    ],
  );

  const meterizedSamples = useMemo(() => {
    return sheetData.samples.map((sample) => ({
      t: sample.t.to('s').scalar.toFixed(2),
      x: sample.x.to('m').scalar.toFixed(2),
      v: sample.v.to('m/s').scalar.toFixed(2),
      motorRPM: sample.motorRPM.to('rpm').scalar.toFixed(0),
      current: sample.current.to('A').scalar.toFixed(2),
      torque: sample.torque.to('N*m').scalar.toFixed(2),
      power: sample.power.to('W').scalar.toFixed(2),
      efficiency: sample.efficiency.scalar.toFixed(3),
    }));
  }, [sheetData.samples]);

  const spinupTime = useMemo(() => {
    return sheetData.samples[sheetData.samples.length - 1].t.to('s');
  }, [sheetData.samples]);

  const samplesWithBatteryVoltage = useMemo(() => {
    return sheetData.samples.map((sample) => ({
      ...sample,
      batteryVoltage: calculateLoadedBatteryVoltage(
        supplyVoltage,
        batteryResistance,
        [sample.current.mul(motor.quantity)],
      ),
    }));
  }, [sheetData.samples, supplyVoltage, batteryResistance, motor.quantity]);

  const minimumBatteryVoltage = useMemo(
    () =>
      new Measurement(
        minBy(
          samplesWithBatteryVoltage,
          (sample) => sample.batteryVoltage.to('V').scalar,
        )?.batteryVoltage.to('V').scalar ?? 0,
        'V',
      ),
    [samplesWithBatteryVoltage],
  );

  return (
    <div>
      <CalcHeading title="Flywheel Calculator" />
      <div className="flex flex-row flex-wrap gap-x-4 px-1 *:flex-1">
        <div className="flex flex-col gap-x-4 gap-y-2">
          <Divider>Motor & Drive System</Divider>
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

          <Divider>Shooter Wheel Properties</Divider>
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
              label="Max Achievable Shooter RPM"
              defaultUnit="rpm"
              roundTo={0}
              testId="maxAchievableShooterRpm"
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[projectileWeight, setProjectileWeight]}
              label="Projectile Weight"
              testId="projectileWeight"
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[customShooterMoi, setCustomShooterMoi]}
              label="Custom Shooter MOI"
              disabled={() => !useCustomShooterMoi}
              testId="customShooterMoi"
            />
            <BooleanInput
              stateHook={[useCustomShooterMoi, setUseCustomShooterMoi]}
              label="Use Custom Shooter MOI"
              testId="useCustomShooterMoi"
            />
          </IOLine>

          <Divider>Flywheel Properties</Divider>
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
              stateHook={[flywhweelToShooterRatio, setFlywhweelToShooterRatio]}
              testId="flywheelToShooterRatio"
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[customFlywheelMoi, setCustomFlywheelMoi]}
              label="Custom Flywheel MOI"
              disabled={() => !useCustomFlywheelMoi}
              testId="customFlywheelMoi"
            />
            <BooleanInput
              stateHook={[useCustomFlywheelMoi, setUseCustomFlywheelMoi]}
              label="Use Custom Flywheel MOI"
              testId="useCustomFlywheelMoi"
            />
          </IOLine>

          <Divider>Outputs</Divider>
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

          <IOLine>
            <MeasurementOutput
              state={spinupTime}
              label="Spinup Time"
              defaultUnit="s"
              testId="spinupTime"
            />
            <MeasurementOutput
              state={minimumBatteryVoltage}
              label="Minimum Battery Voltage"
              defaultUnit="V"
              roundTo={2}
              testId="minimumBatteryVoltage"
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
        </div>
        <ChartContainer config={{}} className="min-h-[200px] w-full">
          <LineChart data={meterizedSamples}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="t" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Line
              dataKey="motorRPM"
              yAxisId="right"
              dot={false}
              stroke="blue"
            />
            <Line
              dataKey="current"
              yAxisId="left"
              dot={false}
              stroke="yellow"
            />
            {/* <Line dataKey="torque" yAxisId="left" dot={false} /> */}
            {/* <Line dataKey="power" yAxisId="left" dot={false} /> */}
            {/* <Line dataKey="efficiency" yAxisId="left" dot={false} /> */}
            <Tooltip />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
