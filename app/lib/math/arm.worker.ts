import type { MeasurementDict } from '~/lib/models/Measurement';
import Measurement from '~/lib/models/Measurement';
import type { MotorDict } from '~/lib/models/Motor';
import Motor from '~/lib/models/Motor';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import { obliterateArray } from '~/lib/utils';
import { arrayToVectorDouble } from '~/lib/wpilib/util';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

const SIM_TIMESTEP_SECONDS = 0.001;

export interface WpilibArmSimState {
  timeSeconds: number;
  angularVelocity: number;
  currentDraw: number;
  batteryVoltage: number;
}

export async function simulateArmWpilib(
  motor_: MotorDict,
  ratio_: RatioDict,
  momentOfInertia_: MeasurementDict,
  armLength_: MeasurementDict,
  minAngle_: MeasurementDict,
  maxAngle_: MeasurementDict,
  startingAngle_: MeasurementDict,
  statorVoltage_: MeasurementDict,
  supplyVoltage_: MeasurementDict,
  currentLimit_: MeasurementDict,
  batteryResistance_: MeasurementDict,
  goingDownOrUp: 'down' | 'up',
): Promise<WpilibArmSimState[]> {
  const wpilibc = await initWpilibc();

  const states: WpilibArmSimState[] = [];

  const motor = Motor.fromDict(motor_);
  const ratio = Ratio.fromDict(ratio_);
  const momentOfInertia = Measurement.fromDict(momentOfInertia_);
  const armLength = Measurement.fromDict(armLength_);
  const minAngle = Measurement.fromDict(minAngle_);
  const maxAngle = Measurement.fromDict(maxAngle_);
  const startingAngle = Measurement.fromDict(startingAngle_);
  const supplyVoltage = Measurement.fromDict(supplyVoltage_);
  const currentLimit = Measurement.fromDict(currentLimit_);
  const batteryResistance = Measurement.fromDict(batteryResistance_);
  const statorVoltage = Measurement.fromDict(statorVoltage_);

  const armSim = new wpilibc.SingleJointedArmSim(
    motor.toWpilibMotor(),
    ratio.asNumber(),
    momentOfInertia.to('kg m^2').scalar,
    armLength.to('m').scalar,
    minAngle.to('rad').scalar,
    maxAngle.to('rad').scalar,
    true,
    startingAngle.to('rad').scalar,
  );

  const iMax = currentLimit.mul(motor.quantity);
  const resistance = new Measurement(motor.toWpilibMotor().getROhms(), 'Ohm');

  let vApplied = statorVoltage;
  let timestamp = 0;
  wpilibc.RoboRioSim_setVInVoltage(supplyVoltage.to('V').scalar);

  while (
    ((goingDownOrUp === 'up' && !armSim.hasHitUpperLimit()) ||
      (goingDownOrUp === 'down' && !armSim.hasHitLowerLimit())) &&
    timestamp < 3
  ) {
    vApplied = supplyVoltage;

    const w = new Measurement(armSim.getAngularVelocity(), 'rad/s')
      .mul(Ratio.fromDict(ratio).asNumber())
      .mul(goingDownOrUp === 'up' ? 1 : -1);

    const vBackEmf = motor.kV.inverse().mul(w);

    vApplied = Measurement.max(
      vBackEmf.sub(iMax.mul(resistance)),
      Measurement.min(vApplied, vBackEmf.add(iMax.mul(resistance))),
    );

    armSim.setInputVoltage(
      goingDownOrUp === 'up'
        ? vApplied.to('V').scalar
        : vApplied.negate().to('V').scalar,
    );
    armSim.update(SIM_TIMESTEP_SECONDS);
    timestamp += SIM_TIMESTEP_SECONDS;

    const currentDraw = new Measurement(armSim.getCurrentDraw(), 'A');
    const supplyCurrent = currentDraw
      .mul(vApplied)
      .div(new Measurement(wpilibc.RobotController_getInputVoltage(), 'V'));

    if (
      (goingDownOrUp === 'up' && !armSim.hasHitUpperLimit()) ||
      (goingDownOrUp === 'down' && !armSim.hasHitLowerLimit())
    ) {
      states.push({
        timeSeconds: parseFloat(timestamp.toFixed(3)),
        angularVelocity: new Measurement(
          armSim.getAngularVelocity(),
          'rad/s',
        ).to('rpm').scalar,
        currentDraw: armSim.getCurrentDraw(),
        batteryVoltage: wpilibc.BatterySim_calculateLoadedBatteryVoltage(
          supplyVoltage.to('V').scalar,
          batteryResistance.to('Ohm').scalar,
          arrayToVectorDouble([supplyCurrent.to('A').scalar]),
        ),
      });
    }
  }

  return obliterateArray(states, 10);
}
