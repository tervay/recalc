import _rawMotorData from "common/models/data/motors.json";
import Measurement, { RawMeasurementJson } from "common/models/Measurement";
import Model from "common/models/Model";
import { MotorRules } from "common/models/Rules";
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
};

const rawMotorDataLookup: Record<string, RawMotorSpec> = keyBy(
  _rawMotorData,
  "name"
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
    public readonly quantity: number
  ) {
    super(identifier);

    this.resistance =
      quantity === 0
        ? new Measurement(0, "ohm")
        : nominalVoltage.div(this.stallCurrent);

    this.kV = this.freeSpeed.div(
      nominalVoltage.sub(this.resistance.mul(this.freeCurrent))
    );

    this.kT = this.stallTorque.div(this.stallCurrent);

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
      quantity
    );
  }

  static getAllMotors(): Motor[] {
    return Object.keys(rawMotorDataLookup).map((s) =>
      this.fromIdentifier(s as string, 1)
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
}

export type IncompleteMotorState = {
  rpm?: Measurement;
  current?: Measurement;
  torque?: Measurement;
  power?: Measurement;
  voltage?: Measurement;
};

export type CompleteMotorState = Required<IncompleteMotorState>;
