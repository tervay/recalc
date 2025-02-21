import _rawMotorData from "common/models/data/motors.json";
import Measurement, { RawMeasurementJson } from "common/models/Measurement";
import Model from "common/models/Model";
import { MotorRules } from "common/models/Rules";
import ODESolver from "common/tooling/ODE";
import keyBy from "lodash/keyBy";

type RawMotorSpec = {
  readonly name: string;
  readonly freeSpeed: RawMeasurementJson;
  readonly stallTorque: RawMeasurementJson;
  readonly stallCurrent: RawMeasurementJson;
  readonly freeCurrent: RawMeasurementJson;
  readonly weight: RawMeasurementJson;
  readonly url: string;
  readonly diameter: RawMeasurementJson;
  readonly controllerWeight: RawMeasurementJson | null;
};

const rawMotorDataLookup: Record<string, RawMotorSpec> = keyBy(
  _rawMotorData,
  "name",
);
export const nominalVoltage = new Measurement(12, "V");
export const highCurrentLimit = new Measurement(1000, "A");

export type MotorDict = {
  readonly quantity: number;
  readonly name: string;
};

export default class Motor extends Model {
  public readonly kV: Measurement;
  public readonly kT: Measurement;
  public readonly kM: Measurement;
  public readonly maxPower: Measurement;
  public readonly resistance: Measurement;
  public readonly b: Measurement;

  constructor(
    identifier: string,
    public readonly freeSpeed: Measurement,
    public readonly stallTorque: Measurement,
    public readonly stallCurrent: Measurement,
    public readonly freeCurrent: Measurement,
    public readonly weight: Measurement,
    public readonly url: string,
    public readonly diameter: Measurement,
    public readonly controllerWeight: Measurement | null,
    public readonly quantity: number,
  ) {
    super(identifier);

    this.resistance = nominalVoltage.div(this.stallCurrent);

    this.kV = this.freeSpeed.div(
      nominalVoltage.sub(this.resistance.mul(this.freeCurrent)),
    );
    this.kT = this.stallTorque.div(this.stallCurrent);
    this.kM = new Measurement(
      this.kT.scalar / Math.sqrt(this.resistance.scalar),
    );
    this.b = this.kT.mul(this.freeCurrent).div(this.freeSpeed);

    this.maxPower = new MotorRules(this, highCurrentLimit, {
      voltage: nominalVoltage,
      rpm: this.freeSpeed.div(2),
      torque: this.stallTorque.div(2),
    }).solve().power;
  }

  toDict(): MotorDict {
    return {
      quantity: this.quantity,
      name: this.identifier as string,
    };
  }

  static fromDict(d: MotorDict): Motor {
    return Motor.fromIdentifier(d.name, d.quantity);
  }

  static fromIdentifier(id: string, quantity: number): Motor {
    return new Motor(
      id,
      Measurement.fromRawJson(rawMotorDataLookup[id].freeSpeed),
      Measurement.fromRawJson(rawMotorDataLookup[id].stallTorque),
      Measurement.fromRawJson(rawMotorDataLookup[id].stallCurrent),
      Measurement.fromRawJson(rawMotorDataLookup[id].freeCurrent),
      Measurement.fromRawJson(rawMotorDataLookup[id].weight),
      rawMotorDataLookup[id].url,
      Measurement.fromRawJson(rawMotorDataLookup[id].diameter),
      rawMotorDataLookup[id].controllerWeight === null
        ? null
        : Measurement.fromRawJson(rawMotorDataLookup[id].controllerWeight),
      quantity,
    );
  }

  static getAllMotors(): Motor[] {
    return Object.keys(rawMotorDataLookup).map((s) =>
      this.fromIdentifier(s as string, 1),
    );
  }

  static getAllChoices(): string[] {
    return Object.keys(rawMotorDataLookup) as string[];
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof Motor && m.identifier === this.identifier;
  }

  static Falcon500s(quantity: number): Motor {
    return Motor.fromIdentifier("Falcon 500", quantity);
  }

  static NEOs(quantity: number): Motor {
    return Motor.fromIdentifier("NEO", quantity);
  }

  static _775pros(quantity: number): Motor {
    return Motor.fromIdentifier("775pro", quantity);
  }

  static CIMs(quantity: number): Motor {
    return Motor.fromIdentifier("CIM", quantity);
  }

  static KrakensWithFOC(quantity: number): Motor {
    return Motor.fromIdentifier("Kraken X60 (FOC)*", quantity);
  }
}

export type IncompleteMotorState = {
  rpm?: Measurement;
  current?: Measurement;
  torque?: Measurement;
  power?: Measurement;
  voltage?: Measurement;
};

export type CompleteMotorState = Required<IncompleteMotorState>;

export type StoppingInfo = {
  position: Measurement;
  velocity: Measurement;
  currentDraw: Measurement;
  stepNumber: number;
};

export function solveMotorODE(
  motor: Motor,
  currentLimit: Measurement,
  shouldStop: (info: StoppingInfo) => boolean,
  J: Measurement,
  antiTorque: Measurement,
  efficiency: number,
) {
  const B = motor.b;

  const microHenryToHenry = (n: number) => n / 1e6;
  const milliHenryToHenry = (n: number) => n / 1e3;
  let L = new Measurement(microHenryToHenry(35), "H");
  if (motor.identifier === "775pro" || motor.identifier === "775 RedLine") {
    L = new Measurement(microHenryToHenry(47), "H");
  } else if (motor.identifier === "miniCIM") {
    L = new Measurement(microHenryToHenry(145), "H");
  } else if (motor.identifier === "Core Hex") {
    L = new Measurement(milliHenryToHenry(52), "H");
  } else if (motor.identifier === "CIM") {
    L = new Measurement(microHenryToHenry(132), "H");
  } else if (motor.identifier === "BAG") {
    L = new Measurement(microHenryToHenry(138), "H");
  }

  // https://github.com/frc971/971-Robot-Code/blob/ecfddf97eb3783916f4355dec98400e0811d3571/frc971/control_loops/python/control_loop.py#L745C30-L745C58
  const inherentMotorInertia = new Measurement(0.00005822569, "kg m2");

  const duration = 30;
  const numStepsPerSec = 800;
  const steps = duration * numStepsPerSec;

  const solver = new ODESolver(
    (t, y) => {
      const prevVel = new Measurement(y[0], "rad/s");
      const prevCurrent = new Measurement(y[1], "A");
      const prevCurrLimit = new Measurement(y[2], "A");
      const prevPosition = new Measurement(y[3], "rad");

      const currToUse = prevCurrent.gte(prevCurrLimit)
        ? prevCurrLimit
        : prevCurrent;
      const limited = prevCurrent.gte(prevCurrLimit);

      const newCurrentPerSec = nominalVoltage
        .sub(motor.resistance.mul(prevCurrent))
        .sub(motor.kV.inverse().mul(prevVel))
        .div(L);

      const newVelocityPerSec = Measurement.max(
        new Measurement(0, "N m"),
        motor.kT
          .mul(motor.quantity)
          .mul(efficiency / 100)
          .mul(currToUse)
          .sub(antiTorque)
          .sub(B.mul(prevVel)),
      )
        .div(J.add(inherentMotorInertia))
        .mul(new Measurement(1, "rad"))
        .toBase();

      return {
        changeRates: [
          newVelocityPerSec.scalar === 0
            ? 0
            : newVelocityPerSec.to("rad/s2").scalar,
          newCurrentPerSec.to("A/s").scalar,
          limited ? 0 : newCurrentPerSec.to("A/s").scalar,
          prevVel.to("rad/s").scalar,
        ],
        shouldStop: shouldStop({
          currentDraw: currToUse,
          position: prevPosition,
          stepNumber: t * numStepsPerSec,
          velocity: prevVel,
        }),
      };
    },
    [0, motor.stallCurrent.scalar, currentLimit.scalar, 0],
    0,
    duration,
  );

  return solver.rk4(steps);
}
