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

    const currentDraw = new Measurement(motorSim.getCurrentDraw(), 'A');

    // Electrical input power.
    const inputPower = vApplied.mul(currentDraw);

    // Mechanical shaft power. WPILib's DCMotorSim models a frictionless plant,
    // so getTorque() returns the electromagnetic torque (Kt * I) rather than the
    // useful shaft torque, and Kt (derived from stall data) is not consistent
    // with Kv (derived from free-speed data). Using Kt * I * w for output power
    // therefore overstates it and yields efficiencies above 100% near free speed
    // for motors where Kt * Kv > 1.
    //
    // Instead, compute shaft power from the back-EMF (w / Kv) acting on the
    // torque-producing current. The no-load (free) current is subtracted because
    // it is consumed by internal friction and produces no useful output. This
    // gives 0% efficiency at stall (w = 0) and at free speed (I = freeCurrent),
    // and stays strictly below 100% in between (copper and no-load losses are
    // both accounted for).
    const backEmf = motor.kV.inverse().mul(w).to('V');
    const torqueCurrent = currentDraw.sub(motor.freeCurrent);
    const outputPower = backEmf.mul(torqueCurrent);

    const efficiency =
      inputPower.baseScalar === 0
        ? new Measurement(0)
        : Measurement.max(outputPower.div(inputPower), new Measurement(0));

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
