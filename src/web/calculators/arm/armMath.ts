import Measurement, { MeasurementDict } from "common/models/Measurement";
import Motor, {
  CompleteMotorState,
  MotorDict,
  nominalVoltage,
} from "common/models/Motor";
import Ratio, { RatioDict } from "common/models/Ratio";
import { MotorRules } from "common/models/Rules";

function calculateArmTorque(
  comLength: Measurement,
  armMass: Measurement,
  currentAngle: Measurement
): Measurement {
  return comLength
    .mul(armMass)
    .mul(Measurement.GRAVITY)
    .mul(Math.cos(currentAngle.to("rad").scalar));
}

function calculateArmInertia(
  comLength: Measurement,
  armMass: Measurement
): Measurement {
  return armMass.mul(comLength).mul(comLength);
}

export function calculateSpringConstant(
  comLength: Measurement,
  armMass: Measurement,
  stringPulleyMountHeight: Measurement,
  stringArmMountDistance: Measurement
): Measurement {
  const leftSide = comLength.mul(armMass);
  const rightSide = stringPulleyMountHeight.mul(stringArmMountDistance);
  return leftSide.div(rightSide);
}

export function calculateMaximumStringArmMountingDistance(
  springLength: Measurement,
  elongationAllowed: number
): Measurement {
  const denom = 1 + Math.SQRT2 * (1 + 1 / elongationAllowed);
  return springLength.div(denom);
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
  iterationLimit: number
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
      currentArmAngle
    );

    const ms = new MotorRules(motor, currentLimit, {
      rpm: currentMotorRpm,
      voltage: nominalVoltage,
    }).solve();

    const outputTorque = ms.torque.mul(motor.quantity).mul(ratio.asNumber());
    const netArmTorque = outputTorque.add(gravitationalTorque);

    const armAngularAccel = netArmTorque.div(inertia);
    currentArmRpm = currentArmRpm.add(
      armAngularAccel.mul(timeDelta).mul(new Measurement(1, "rad"))
    );

    currentArmAngle = currentArmAngle.add(
      timeDelta
        .mul(currentArmRpm)
        .add(
          armAngularAccel
            .mul(timeDelta)
            .mul(timeDelta)
            .div(2)
            .mul(new Measurement(1, "rad"))
        )
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
