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
import BooleanInput from '~/components/recalc/io/boolean';
import {
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import { MotorInput } from '~/components/recalc/io/motor';
import { RatioInput } from '~/components/recalc/io/ratio';
import { ChartContainer } from '~/components/ui/chart';
import { useQueryParams } from '~/lib/hooks';
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
    motor: withDefault(MotorParam, Motor.fromName('Kraken X60 (FOC)', 2)),
    ratio: withDefault(RatioParam, new Ratio(1, RatioType.REDUCTION)),
    statorLimit: withDefault(MeasurementParam, new Measurement(30, 'A')),
    supplyLimit: withDefault(MeasurementParam, new Measurement(90, 'A')),
    shooterDiameter: withDefault(MeasurementParam, new Measurement(6, 'in')),
    shooterWeight: withDefault(MeasurementParam, new Measurement(1, 'lb')),
    shooterTargetSpeed: withDefault(
      MeasurementParam,
      new Measurement(3000, 'rpm'),
    ),
    customShooterMoi: withDefault(
      MeasurementParam,
      new Measurement(4.5, 'in^2 lbs'),
    ),
    useCustomShooterMoi: withDefault(BooleanParam, false),
    flywheelDiameter: withDefault(MeasurementParam, new Measurement(4, 'in')),
    flywheelWeight: withDefault(MeasurementParam, new Measurement(1.5, 'lb')),
    customFlywheelMoi: withDefault(
      MeasurementParam,
      new Measurement(3, 'lb in^2'),
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
  const [flywheelDiameter] = useState(queryParams.flywheelDiameter);
  const [flywheelWeight] = useState(queryParams.flywheelWeight);
  const [customFlywheelMoi] = useState(queryParams.customFlywheelMoi);
  const [useCustomFlywheelMoi] = useState(queryParams.useCustomFlywheelMoi);
  const [flywhweelToShooterRatio] = useState(
    queryParams.flywhweelToShooterRatio,
  );
  const [_projectileDiameter] = useState(queryParams.projectileDiameter);
  const [_projectileWeight] = useState(queryParams.projectileWeight);
  const [efficiency] = useState(queryParams.efficiency);

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
        ? new Measurement(0, 'in^2 * lbs')
        : usableShooterMOI
            .add(
              usableFlywheelMOI.div(
                flywhweelToShooterRatio.asNumber() == 0
                  ? 1
                  : Math.pow(flywhweelToShooterRatio.asNumber(), 2),
              ),
            )
            .div(ratio.asNumber()),
    [usableShooterMOI, usableFlywheelMOI, flywhweelToShooterRatio, ratio],
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
      new MotorRules(motor, statorLimit, {
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
    statorLimit,
    ratio,
    efficiency,
    totalMomentOfInertia,
  ]);

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
        statorLimit,
        new Measurement(0, 'm/s^2'),
        shooterDiameter,
        shooterTargetSpeed.mul(shooterDiameter.div(2)).removeRad(),
      ),
    [
      motor,
      efficiency,
      ratio,
      statorLimit,
      shooterDiameter,
      shooterTargetSpeed,
      totalMomentOfInertia,
    ],
  );

  const meterizedSamples = useMemo(() => {
    return sheetData.samples.map((sample) => ({
      t: sample.t.to('s').scalar,
      x: sample.x.to('m').scalar,
      v: sample.v.to('m/s').scalar,
      motorRPM: sample.motorRPM.to('rpm').scalar,
      current: sample.current.to('A').scalar,
      torque: sample.torque.to('N*m').scalar,
      power: sample.power.to('W').scalar,
      efficiency: sample.efficiency.scalar,
    }));
  }, [sheetData.samples]);

  const spinupTime = useMemo(() => {
    return sheetData.samples[sheetData.samples.length - 1].t.to('s');
  }, [sheetData.samples]);

  return (
    <div>
      <CalcHeading title="Flywheel Calculator" />
      <div className="flex flex-row flex-wrap gap-x-4 px-1 [&>*]:flex-1">
        <div className="flex flex-col gap-x-4 gap-y-2">
          <IOLine>
            <MotorInput stateHook={[motor, setMotor]} />
            <RatioInput stateHook={[ratio, setRatio]} />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[shooterDiameter, setShooterDiameter]}
              label="Shooter Diameter"
            />
            <MeasurementInput
              stateHook={[shooterWeight, setShooterWeight]}
              label="Shooter Weight"
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[shooterTargetSpeed, setShooterTargetSpeed]}
              label="Shooter Target Speed"
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[customShooterMoi, setCustomShooterMoi]}
              label="Custom Shooter MOI"
              disabled={() => !useCustomShooterMoi}
            />
            <BooleanInput
              stateHook={[useCustomShooterMoi, setUseCustomShooterMoi]}
              label="Use Custom Shooter MOI"
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[statorLimit, setStatorLimit]}
              label="Stator Limit"
            />
            <MeasurementInput
              stateHook={[supplyLimit, setSupplyLimit]}
              label="Supply Limit"
            />
          </IOLine>

          <IOLine>
            <MeasurementOutput state={kV} label="kV" defaultUnit="V*s/m" />
            <MeasurementOutput state={kA} label="kA" defaultUnit="V*s^2/m" />
          </IOLine>

          <IOLine>
            <MeasurementOutput
              state={spinupTime}
              label="Spinup Time"
              defaultUnit="s"
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
