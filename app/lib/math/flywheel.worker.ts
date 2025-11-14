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

export interface WpilibFlywheelSimState {
  timeSeconds: number;
  angularVelocity: number;
  currentDraw: number;
  batteryVoltage: number;
}

export async function simulateFlywheelWpilib(
  motor_: MotorDict,
  ratio_: RatioDict,
  currentLimit_: MeasurementDict,
  statorVoltage_: MeasurementDict,
  supplyVoltage_: MeasurementDict,
  batteryResistance_: MeasurementDict,
  momentOfInertia_: MeasurementDict,
  targetRPM_: MeasurementDict,
): Promise<WpilibFlywheelSimState[]> {
  const wpilibc = await initWpilibc();

  const states: WpilibFlywheelSimState[] = [];

  const motor = Motor.fromDict(motor_);
  const ratio = Ratio.fromDict(ratio_);
  const currentLimit = Measurement.fromDict(currentLimit_);
  const statorVoltage = Measurement.fromDict(statorVoltage_);
  const supplyVoltage = Measurement.fromDict(supplyVoltage_);
  const batteryResistance = Measurement.fromDict(batteryResistance_);
  const momentOfInertia = Measurement.fromDict(momentOfInertia_);
  const targetRPM = Measurement.fromDict(targetRPM_);

  if (
    ratio.asNumber() === 0 ||
    motor.quantity === 0 ||
    currentLimit.scalar === 0 ||
    momentOfInertia.scalar === 0 ||
    statorVoltage.scalar === 0 ||
    supplyVoltage.scalar === 0 ||
    batteryResistance.scalar === 0 ||
    targetRPM.scalar === 0
  ) {
    return [];
  }

  const flywheelSim = new wpilibc.FlywheelSim(
    motor.toWpilibMotor(),
    ratio.asNumber(),
    momentOfInertia.to('kg m^2').scalar,
  );

  wpilibc.RoboRioSim_setVInVoltage(supplyVoltage.to('V').scalar);
  const resistance = new Measurement(motor.toWpilibMotor().getROhms(), 'Ohm');
  let vApplied = statorVoltage;
  const iMax = currentLimit.mul(motor.quantity);
  let timestamp = 0;

  while (
    new Measurement(flywheelSim.getAngularVelocity(), 'rad/s').lte(targetRPM)
  ) {
    vApplied = statorVoltage;
    const w = new Measurement(flywheelSim.getAngularVelocity(), 'rad/s').mul(
      Ratio.fromDict(ratio).asNumber(),
    );

    const vBackEmf = motor.kV.inverse().mul(w);

    vApplied = Measurement.max(
      vBackEmf.sub(iMax.mul(resistance)),
      Measurement.min(vApplied, vBackEmf.add(iMax.mul(resistance))),
    );
    flywheelSim.setInputVoltage(vApplied.to('V').scalar);
    flywheelSim.update(SIM_TIMESTEP_SECONDS);
    timestamp += SIM_TIMESTEP_SECONDS;

    states.push({
      timeSeconds: parseFloat(timestamp.toFixed(3)),
      angularVelocity: new Measurement(
        flywheelSim.getAngularVelocity(),
        'rad/s',
      ).to('rpm').scalar,
      currentDraw: flywheelSim.getCurrentDraw(),
      batteryVoltage: wpilibc.BatterySim_calculateLoadedBatteryVoltage(
        supplyVoltage.to('V').scalar,
        batteryResistance.to('Ohm').scalar,
        arrayToVectorDouble([flywheelSim.getCurrentDraw()]),
      ),
    });
  }

  return obliterateArray(states, 10);
}
