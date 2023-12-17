import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, {
  CompleteMotorState,
  MotorDict,
  nominalVoltage,
} from "common/models/Motor";
import Ratio, { RatioDict } from "common/models/Ratio";
import { MotorRules } from "common/models/Rules";
import { expose } from "common/tooling/promise-worker";
import { Derivative, Solver } from "odex";

function calculateArmTorque(
  comLength: Measurement,
  armMass: Measurement,
  currentAngle: Measurement,
): Measurement {
  return comLength
    .mul(armMass)
    .mul(Measurement.GRAVITY)
    .mul(Math.cos(currentAngle.to("rad").scalar));
}

function calculateArmInertia(
  comLength: Measurement,
  armMass: Measurement,
): Measurement {
  return armMass.mul(comLength).mul(comLength);
}

export function calculateSpringConstant(
  comLength: Measurement,
  armMass: Measurement,
  stringPulleyMountHeight: Measurement,
  stringArmMountDistance: Measurement,
): Measurement {
  const leftSide = comLength.mul(armMass);
  const rightSide = stringPulleyMountHeight.mul(stringArmMountDistance);
  return leftSide.div(rightSide);
}

export function calculateMaximumStringArmMountingDistance(
  springLength: Measurement,
  elongationAllowed: number,
): Measurement {
  const denom = 1 + Math.SQRT2 * (1 + 1 / elongationAllowed);
  return springLength.div(denom);
}

export function deriv(
  kcos: Measurement,
  komega: Measurement,
  k: Measurement,
  max_motor_brake: Measurement,
  k_min_motor_brake: Measurement,
  direction: number,
): Derivative {
  return function (t, y) {
    const phi_d = new Measurement(y[1], "rad/s");

    let motor_brake_decel = komega.mul(phi_d).add(k.mul(direction));

    if (motor_brake_decel.abs().gt(max_motor_brake)) {
      motor_brake_decel = max_motor_brake.mul(direction).negate();
    }

    if (motor_brake_decel.abs().lt(k_min_motor_brake.mul(phi_d))) {
      motor_brake_decel = k_min_motor_brake.mul(phi_d).mul(direction).negate();
    }

    if (motor_brake_decel.abs().gt(max_motor_brake)) {
      motor_brake_decel = max_motor_brake.mul(direction).negate();
    }

    const phi_dd = kcos
      .mul(Math.cos(y[0]))
      .add(motor_brake_decel)
      .mul(new Measurement(1, "rad"));

    return [phi_d.to("rad/s").scalar, phi_dd.to("rad/s2").scalar];
  };
}

export function getDecelerationTime(
  start_angle: Measurement,
  start_velocity: Measurement,
  ratio: Ratio,
  comLength: Measurement,
  motor: Motor,
  mass: Measurement,
  currentLimit: Measurement,
  inertia: Measurement,
) {
  const k_cos = comLength
    .mul(mass)
    .mul(Measurement.GRAVITY.negate())
    .div(inertia)
    .negate();

  const k_omega = motor.kT
    .mul(ratio.asNumber())
    .mul(ratio.asNumber())
    .div(motor.resistance.mul(motor.kV).mul(inertia));

  const k = motor.kT
    .mul(ratio.asNumber())
    .negate()
    .mul(motor.stallCurrent.add(motor.freeCurrent))
    .div(inertia);

  const max_motor_brake_decel = currentLimit
    .mul(ratio.asNumber())
    .mul(motor.kT)
    .div(inertia);

  const min_motor_brake = motor.kT
    .negate()
    .mul(ratio.asNumber())
    .mul(ratio.asNumber())
    .div(motor.resistance.mul(motor.kV).mul(inertia));

  const solver = new Solver(
    deriv(
      k_cos,
      k_omega,
      k,
      max_motor_brake_decel,
      min_motor_brake,
      start_velocity.sign(),
    ),
    2,
  );

  let sentinel = false;
  const slowdownStates: MomentaryArmState[] = [];

  solver.solve(
    0,
    [start_angle.to("rad").scalar, start_velocity.to("rad/s").scalar],
    0.15,
    solver.grid(0.002, (t, y) => {
      if (!sentinel) {
        const ms = new MotorRules(motor, currentLimit, {
          voltage: nominalVoltage,
          rpm: new Measurement(y[1], "rad/s").mul(ratio.asNumber()),
        }).solve();
        slowdownStates.push({
          position: new Measurement(y[0], "rad").toDict(),
          time: new Measurement(t, "s").toDict(),
          motorState: {
            current: ms.current.toDict(),
            power: ms.power.toDict(),
            rpm: ms.rpm.to("rpm").toDict(),
            torque: ms.torque.toDict(),
            voltage: ms.voltage.toDict(),
          },
        });
      }

      if (
        (start_velocity.sign() > 0 && y[1] < 0) ||
        (start_velocity.sign() < 0 && y[1] > 0)
      ) {
        if (!sentinel) {
          sentinel = true;
        }

        return false;
      }
    }),
  );
  console.log(slowdownStates);
}

export type MomentaryArmState = {
  time: MeasurementDict;
  position: MeasurementDict;
  motorState: { [k in keyof CompleteMotorState]: MeasurementDict };
};
export function calculateArmStates(
  motor_: MotorDict,
  ratio_: RatioDict,
  comLength_: MeasurementDict,
  armMass_: MeasurementDict,
  currentLimit_: MeasurementDict,
  startAngle_: MeasurementDict,
  endAngle_: MeasurementDict,
  efficiency: number,
  iterationLimit: number,
): MomentaryArmState[] {
  const motor = Motor.fromDict(motor_);
  const ratio = Ratio.fromDict(ratio_);
  const comLength = Measurement.fromDict(comLength_);
  const armMass = Measurement.fromDict(armMass_);
  const currentLimit = Measurement.fromDict(currentLimit_);
  const startAngle = Measurement.fromDict(startAngle_);
  const endAngle = Measurement.fromDict(endAngle_);

  if (
    [
      motor.quantity,
      ratio.asNumber(),
      comLength.scalar,
      armMass.scalar,
      currentLimit.scalar,
    ].includes(0)
  ) {
    return [];
  }

  const states: MomentaryArmState[] = [];
  let currentArmAngle = startAngle;
  let currentArmRpm = new Measurement(0, "rpm");
  let currentTime = new Measurement(0, "s");
  let currentMotorRpm = new Measurement(0, "rpm");
  let n = 0;
  const timeDelta = new Measurement(0.0005, "s");

  while (currentArmAngle.lt(endAngle)) {
    n++;

    currentTime = currentTime.add(timeDelta);
    const inertia = calculateArmInertia(comLength, armMass);
    const gravitationalTorque = calculateArmTorque(
      comLength,
      armMass,
      currentArmAngle,
    );

    const ms = new MotorRules(motor, currentLimit, {
      rpm: currentMotorRpm,
      voltage: nominalVoltage,
    }).solve();

    const outputTorque = ms.torque
      .mul(motor.quantity)
      .mul(ratio.asNumber())
      .mul(efficiency / 100.0);
    const netArmTorque = outputTorque.add(gravitationalTorque);

    const armAngularAccel = netArmTorque.div(inertia);
    currentArmRpm = currentArmRpm.add(
      armAngularAccel.mul(timeDelta).mul(new Measurement(1, "rad")),
    );

    currentArmAngle = currentArmAngle.add(
      timeDelta
        .mul(currentArmRpm)
        .add(
          armAngularAccel
            .mul(timeDelta)
            .mul(timeDelta)
            .div(2)
            .mul(new Measurement(1, "rad")),
        ),
    );

    currentMotorRpm = currentArmRpm
      .mul(ratio.asNumber())
      .clamp(motor.freeSpeed.negate(), motor.freeSpeed);

    states.push({
      time: currentTime.toDict(),
      position: currentArmAngle.toDict(),
      motorState: {
        current: ms.current.toDict(),
        power: ms.power.toDict(),
        rpm: ms.rpm.toDict(),
        torque: ms.torque.toDict(),
        voltage: ms.voltage.toDict(),
      },
    });

    if (n > iterationLimit) {
      return states;
    }
  }

  return states;
}

const workerFunctions = {
  calculateArmInertia,
  calculateArmTorque,
  calculateSpringConstant,
  calculateMaximumStringArmMountingDistance,
  calculateArmStates,
};

expose(workerFunctions);
type ArmWorkerFunctions = typeof workerFunctions;
export type { ArmWorkerFunctions };
