import _rawMotorData from "common/models/data/motors.json";
import { RawMeasurementJson } from "common/models/Measurement";
import Model from "common/models/Model";
import {
  amperes,
  AngularSpeed,
  Current,
  Length,
  Mass,
  MotorVelocityConstant,
  Torque,
  volts,
} from "common/models/units";
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
// export const nominalVoltage = new Measurement(12, "V");
// export const highCurrentLimit = new Measurement(1000, "A");

export const NOMINAL_VOLTAGE = volts(12);
export const HIGH_CURRENT_LIMIT = amperes(1000);

export type MotorDict = {
  readonly quantity: number;
  readonly name: string;
};

export default class TypedMotor extends Model {
  public readonly kV: MotorVelocityConstant;

  constructor(
    identifier: string,
    public readonly freeSpeed: AngularSpeed,
    public readonly stallTorque: Torque,
    public readonly stallCurrent: Current,
    public readonly freeCurrent: Current,
    public readonly weight: Mass,
    public readonly url: string,
    public readonly diameter: Length,
    public readonly quantity: number
  ) {
    super(identifier);

    this.kV = this.freeSpeed.per(NOMINAL_VOLTAGE);
  }

  toDict(): Record<string, unknown> {
    throw new Error("Method not implemented.");
  }
  eq<M extends Model>(m: M): boolean {
    throw new Error("Method not implemented.");
  }
}
