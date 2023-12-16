import _rawMotorData from "common/models/data/motors.json";
import Measurement, { RawMeasurementJson } from "common/models/Measurement";
import Model from "common/models/Model";
import { MotorRules } from "common/models/Rules";
import keyBy from "lodash/keyBy";
import { Derivative } from "odex";

type RawMotorSpec = {
  readonly name: string;
  readonly freeSpeed: RawMeasurementJson;
  readonly stallTorque: RawMeasurementJson;
  readonly stallCurrent: RawMeasurementJson;
  readonly freeCurrent: RawMeasurementJson;
  readonly weight: RawMeasurementJson;
  readonly url: string;
  readonly diameter: RawMeasurementJson;
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

  constructor(
    identifier: string,
    public readonly freeSpeed: Measurement,
    public readonly stallTorque: Measurement,
    public readonly stallCurrent: Measurement,
    public readonly freeCurrent: Measurement,
    public readonly weight: Measurement,
    public readonly url: string,
    public readonly diameter: Measurement,
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

  diffEq(
    J: Measurement,
    B: Measurement,
    L_inductance: Measurement,
  ): Derivative {
    const kT = this.kT;
    const resistance = this.resistance;
    const kB = this.kV.inverse();

    return function (t: number, y: number[]) {
      const prevVel = new Measurement(y[0], "rad/s");
      const prevCurrent = new Measurement(y[1], "A");

      const newCurrentPerSec = nominalVoltage
        .sub(resistance.mul(prevCurrent))
        .sub(kB.mul(prevVel))
        .div(L_inductance);

      // console.log(
      //   stringifyMeasurements({
      //     newCurrentPerSec: newCurrentPerSec.to("A/s"),
      //     nominalVoltage,
      //     kB,
      //     prevVel,
      //     resTimesPrevCurr: resistance.mul(prevCurrent).to("V"),
      //     prevCurrent,
      //     kbTimesPrevVel: kB.mul(prevVel).to("V"),
      //   }),
      // );

      const newVelocityPerSec = kT
        .mul(prevCurrent)
        .sub(B.mul(prevVel))
        .div(J)
        .mul(new Measurement(1, "rad"))
        .toBase();

      return [
        newVelocityPerSec.scalar === 0
          ? 0
          : newVelocityPerSec.to("rad/s2").scalar,
        newCurrentPerSec.to("A/s").scalar,
      ];
    };
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

export function AccelCruiseDecelSolver(dPrime: Derivative, stepSize: number) {}
