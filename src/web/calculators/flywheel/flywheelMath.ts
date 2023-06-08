import Measurement from "common/models/Measurement";
import Motor, { nominalVoltage } from "common/models/Motor";
import Ratio from "common/models/Ratio";
import { MotorRules } from "common/models/Rules";

export function calculateWindupTime(
  momentOfInertia: Measurement,
  motor: Motor,
  currentLimit: Measurement,
  ratio: Ratio,
  targetSpeed: Measurement
): Measurement {
  return calculateRecoveryTime(
    momentOfInertia,
    motor,
    ratio,
    0.0,
    targetSpeed,
    new Measurement(0, "rpm"),
    currentLimit
  );
}

export function calculateShooterWheelSurfaceSpeed(
  speed: Measurement,
  radius: Measurement
): Measurement {
  return speed.mul(radius).removeRad().to("ft/s");
}

export function projectileSpeedTransferPercentage(
  projectileWeight: Measurement,
  shooterWheelRadius: Measurement,
  totalMOI: Measurement
): Measurement {
  if (Measurement.anyAreZero(shooterWheelRadius, projectileWeight)) {
    return new Measurement(0);
  }
  return totalMOI
    .mul(20)
    .div(
      projectileWeight
        .mul(shooterWheelRadius.mul(2))
        .mul(shooterWheelRadius.mul(2))
        .mul(7)
        .add(totalMOI.mul(40))
    );
}

export function calculateProjectileExitVelocity(
  projectileWeight: Measurement,
  shooterWheelRadius: Measurement,
  totalMOI: Measurement,
  shooterWheelSurfaceSpeed: Measurement
): Measurement {
  return shooterWheelSurfaceSpeed.mul(
    projectileSpeedTransferPercentage(
      projectileWeight,
      shooterWheelRadius,
      totalMOI
    )
  );
}

export function calculateProjectileEnergy(
  projectileVelocity: Measurement,
  projectileWeight: Measurement
): Measurement {
  return projectileWeight
    .mul(projectileVelocity)
    .mul(projectileVelocity)
    .mul(0.7)
    .to("J");
}

export function calculateFlywheelEnergy(
  totalMomentOfInertia: Measurement,
  targetSpeed: Measurement
): Measurement {
  return totalMomentOfInertia
    .mul(targetSpeed)
    .mul(targetSpeed)
    .mul(0.5)
    .removeRad()
    .removeRad()
    .to("J");
}

export function calculateSpeedAfterShot(
  totalMomentOfInertia: Measurement,
  flywheelEnergy: Measurement,
  projectileEnergy: Measurement
): Measurement {
  if (Measurement.anyAreZero(totalMomentOfInertia)) {
    return new Measurement(0, "rpm");
  }

  const v2 = flywheelEnergy
    .sub(projectileEnergy)
    .div(totalMomentOfInertia.mul(0.5))
    .mul(new Measurement(1, "rad^2"))
    .to("rpm^2");

  if (v2.lt(new Measurement(0, "rpm^2"))) {
    return new Measurement(0, "rpm");
  }
  return new Measurement(Math.sqrt(v2.scalar), "rpm");
}

export function calculateRecoveryTime(
  totalMomentOfInertia: Measurement,
  motor: Motor,
  ratio: Ratio,
  variation: number,
  targetSpeed: Measurement,
  initialSpeed: Measurement,
  currentLimit: Measurement
): Measurement {
  if (motor.quantity === 0 || ratio.asNumber() === 0) {
    return new Measurement(0, "s");
  }

  const wheelFreeSpeed = motor.freeSpeed.div(ratio.asNumber());

  const torque = new MotorRules(motor, currentLimit, {
    voltage: nominalVoltage,
    rpm: new Measurement(0, "rpm"),
  }).solve().torque;

  if (torque.scalar === 0) {
    return new Measurement(0, "s");
  }

  const t1 = totalMomentOfInertia.negate().mul(wheelFreeSpeed);
  const t2 = torque.mul(motor.quantity).mul(ratio.asNumber());

  const t3 = wheelFreeSpeed.sub(targetSpeed.mul(1 - variation));
  const t4 = wheelFreeSpeed.sub(initialSpeed);

  const logged = Math.log(t3.div(t4).scalar);

  if (isNaN(logged)) {
    return new Measurement(0, "s");
  }

  return t1.mul(logged).div(t2).removeRad().to("s");
}
