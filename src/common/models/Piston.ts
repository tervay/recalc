import Measurement, { MeasurementDict } from "common/models/Measurement";
import Model from "common/models/Model";
import { closestNumberFromArray } from "common/tooling/util";
import { isEqual } from "lodash";

export type PistonDict = {
  readonly name: string;
  readonly quantity: number;
  readonly bore: MeasurementDict;
  readonly rodDiameter: MeasurementDict;
  readonly strokeLength: MeasurementDict;
  readonly retractPressure: MeasurementDict;
  readonly extendPressure: MeasurementDict;
  readonly enabled: boolean;
  readonly period: MeasurementDict;
};

enum State {
  RETRACTED,
  EXTENDED,
}

const boreToRodDiameter: Record<number, number> = {
  0.3125: 0.125,
  0.4375: 0.1875,
  0.5625: 0.1875,
  0.75: 0.25,
  0.875: 0.25,
  1.0625: 0.3125,
  1.25: 0.4375,
  1.5: 0.4375,
  1.75: 0.5,
  2: 0.625,
  2.5: 0.625,
  3: 0.75,
};

export default class Piston extends Model {
  constructor(
    public name: string,
    public quantity: number,
    public bore: Measurement,
    public rodDiameter: Measurement,
    public strokeLength: Measurement,
    public retractPressure: Measurement,
    public extendPressure: Measurement,
    public enabled: boolean,
    public period: Measurement,
    public state: State = State.RETRACTED
  ) {
    super(name);
  }

  getExtendForce(pressure: Measurement): Measurement {
    const boreRadius = this.bore.div(2);
    const boreArea = boreRadius.mul(boreRadius).mul(Math.PI);
    return boreArea.mul(pressure).mul(this.quantity);
  }

  getRetractForce(pressure: Measurement): Measurement {
    const boreRadius = this.bore.div(2);
    const boreArea = boreRadius.mul(boreRadius).mul(Math.PI);
    const shaftRadius = this.rodDiameter.div(2);
    const shaftArea = shaftRadius.mul(shaftRadius).mul(Math.PI);
    return boreArea.sub(shaftArea).mul(pressure).mul(this.quantity);
  }

  getExtendWork(systemPressure: Measurement): Measurement {
    return this.getExtendForce(
      Measurement.min(systemPressure, this.extendPressure)
    ).mul(this.strokeLength);
  }

  getRetractWork(systemPressure: Measurement): Measurement {
    return this.getRetractForce(
      Measurement.min(systemPressure, this.retractPressure)
    ).mul(this.strokeLength);
  }

  getWork(systemPressure: Measurement): Measurement {
    return this.getExtendWork(systemPressure).add(
      this.getRetractWork(systemPressure)
    );
  }

  toggleState(): void {
    this.state =
      this.state === State.EXTENDED ? State.RETRACTED : State.EXTENDED;
  }

  toggleStateAndGetWorkFromIt(systemPressure: Measurement): Measurement {
    this.toggleState();
    return this.state === State.EXTENDED
      ? this.getExtendWork(systemPressure)
      : this.getRetractWork(systemPressure);
  }

  toDict(): PistonDict {
    return {
      name: this.name,
      quantity: this.quantity,
      bore: this.bore.toDict(),
      rodDiameter: this.rodDiameter.toDict(),
      strokeLength: this.strokeLength.toDict(),
      retractPressure: this.retractPressure.toDict(),
      extendPressure: this.extendPressure.toDict(),
      enabled: this.enabled,
      period: this.period.toDict(),
    };
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof Piston && isEqual(this.name, m.name);
  }

  static fromDict(d: PistonDict): Piston {
    return new Piston(
      d.name,
      d.quantity,
      Measurement.fromDict(d.bore),
      Measurement.fromDict(d.rodDiameter),
      Measurement.fromDict(d.strokeLength),
      Measurement.fromDict(d.retractPressure),
      Measurement.fromDict(d.extendPressure),
      d.enabled,
      Measurement.fromDict(d.period)
    );
  }

  static rodDiameterFromBore(bore: Measurement): Measurement {
    const boreInches = bore.to("in").scalar;
    const choices = Object.keys(boreToRodDiameter).map((n) => Number(n));
    const rodInches =
      boreToRodDiameter[closestNumberFromArray(choices, boreInches)];
    return new Measurement(rodInches, "in");
  }
}
