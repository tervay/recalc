import { supplyLimitToStatorLimit } from '~/lib/math/common';
import Measurement, { type MeasurementDict } from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

const SIM_TIMESTEP_SECONDS = 0.0001;

export interface WpilibMotorSimState {
  angularVelocityRPM: number;
  currentDrawAmps: number;
  torqueNewtonMeters: number;
  efficiency: number;
}

export async function generateMotorCurve(
  motor_: MotorDict,
  statorLimit_: MeasurementDict,
  supplyLimit_: MeasurementDict,
  statorVoltage_: MeasurementDict,
  supplyVoltage_: MeasurementDict,
) {
  const wpilibc = await initWpilibc();

  const states: WpilibMotorSimState[] = [];

  const motor = Motor.fromDict(motor_);
  const statorLimit = Measurement.fromDict(statorLimit_);
  const supplyLimit = Measurement.fromDict(supplyLimit_);
  const statorVoltage = Measurement.fromDict(statorVoltage_);
  const supplyVoltage = Measurement.fromDict(supplyVoltage_);
  const ratio = new Ratio(1, RatioType.REDUCTION);

  const supplyVoltageInStatorTerms = supplyLimitToStatorLimit({
    supplyLimit,
    supplyVoltage,
    statorVoltage,
  });

  const limitingCurrent = Measurement.min(
    statorLimit,
    supplyVoltageInStatorTerms,
  );

  const iMax = limitingCurrent.mul(motor.quantity);
  const resistance = new Measurement(motor.toWpilibMotor().getROhms(), 'Ohm');
  const motorInertia = new Measurement(0.1 * (0.95 * 0.0254) ** 2.0, 'kg m2');

  const motorSim = new wpilibc.DCMotorSim(
    motor.toWpilibMotor(),
    ratio.asNumber(),
    motorInertia.to('kg m2').scalar,
  );

  wpilibc.RoboRioSim_setVInVoltage(supplyVoltage.to('V').scalar);
  let vApplied = statorVoltage;

  while (
    new Measurement(motorSim.getAngularVelocity(), 'rad/s').lte(motor.freeSpeed)
  ) {
    vApplied = statorVoltage;
    const w = new Measurement(motorSim.getAngularVelocity(), 'rad/s').mul(
      ratio.asNumber(),
    );
    const vBackEmf = motor.kV.inverse().mul(w);
    vApplied = Measurement.max(
      vBackEmf.sub(iMax.mul(resistance)),
      Measurement.min(vApplied, vBackEmf.add(iMax.mul(resistance))),
    );
    motorSim.setInputVoltage(vApplied.to('V').scalar);
    motorSim.update(SIM_TIMESTEP_SECONDS);

    const inputPower = vApplied.mul(
      new Measurement(motorSim.getCurrentDraw(), 'A'),
    );
    const outputPower = new Measurement(motorSim.getTorque(), 'N m')
      .mul(w)
      .removeRad();

    const efficiency = outputPower.div(inputPower);

    states.push({
      angularVelocityRPM: parseInt(
        new Measurement(motorSim.getAngularVelocity(), 'rad/s')
          .to('rpm')
          .scalar.toFixed(0),
      ),
      currentDrawAmps: motorSim.getCurrentDraw(),
      torqueNewtonMeters: new Measurement(motorSim.getTorque(), 'N m').scalar,
      efficiency: efficiency.baseScalar,
    });
  }

  return states;
}
