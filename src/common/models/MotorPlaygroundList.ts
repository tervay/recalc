import { EzDataset, webworkerDataset } from "common/components/graphing/types";
import Measurement, { MeasurementDict } from "common/models/Measurement";
import Model from "common/models/Model";
import Motor, { MotorDict } from "common/models/Motor";
import Ratio, { RatioDict } from "common/models/Ratio";
import { MotorRules } from "common/models/Rules";
import { gappedRange } from "common/tooling/util";
import { isEqual } from "lodash";

type MotorPlaygroundEntryDict = {
  readonly motor: MotorDict;
  readonly currentLimit: MeasurementDict;
  readonly ratio: RatioDict;
  readonly voltage: MeasurementDict;
  readonly visibilityOptions: VisibilityOptions;
};

type VisibilityOptions = {
  readonly showPower: boolean;
  readonly showTorque: boolean;
  readonly showCurrent: boolean;
};

export class MotorPlaygroundEntry extends Model {
  constructor(
    public readonly motor: Motor,
    public readonly currentLimit: Measurement,
    public readonly voltage: Measurement,
    public readonly ratio: Ratio,
    public readonly visibilityOptions: VisibilityOptions,
  ) {
    super(motor.identifier + currentLimit.identifier);
  }

  datasets(): EzDataset[] {
    const motorStates = gappedRange(
      0,
      this.motor.kV.mul(this.voltage).to("rpm").scalar,
      300,
    ).map((n) =>
      new MotorRules(this.motor, this.currentLimit, {
        voltage: this.voltage,
        rpm: new Measurement(n, "rpm"),
      }).solve(),
    );

    const ret = [];

    if (this.visibilityOptions.showPower) {
      ret.push(
        webworkerDataset(
          `${this.motor.identifier} power`,
          motorStates.map((ms) => ({
            x: ms.rpm.to("rpm").scalar,
            y: ms.power.mul(this.motor.quantity).to("W").scalar,
          })),
          Motor.getAllChoices().indexOf(this.motor.identifier) + 1,
          `y${Motor.getAllChoices().indexOf(this.motor.identifier) + 1}-power`,
        ),
      );
    }
    if (this.visibilityOptions.showTorque) {
      ret.push(
        webworkerDataset(
          `${this.motor.identifier} torque`,
          motorStates.map((ms) => ({
            x: ms.rpm.to("rpm").scalar,
            y: ms.torque.mul(this.motor.quantity).to("N*m").scalar,
          })),
          Motor.getAllChoices().indexOf(this.motor.identifier) + 1 + 100,
          `y${Motor.getAllChoices().indexOf(this.motor.identifier) + 1}-torque`,
        ),
      );
    }
    if (this.visibilityOptions.showCurrent) {
      ret.push(
        webworkerDataset(
          `${this.motor.identifier} current`,
          motorStates.map((ms) => ({
            x: ms.rpm.to("rpm").scalar,
            y: ms.current.mul(this.motor.quantity).to("A").scalar,
          })),
          Motor.getAllChoices().indexOf(this.motor.identifier) + 1 + 200,
          `y${
            Motor.getAllChoices().indexOf(this.motor.identifier) + 1
          }-current`,
        ),
      );
    }

    return ret;
  }

  toDict(): MotorPlaygroundEntryDict {
    return {
      motor: this.motor.toDict(),
      currentLimit: this.currentLimit.toDict(),
      ratio: this.ratio.toDict(),
      voltage: this.voltage.toDict(),
      visibilityOptions: this.visibilityOptions,
    };
  }

  static fromDict(d: MotorPlaygroundEntryDict): MotorPlaygroundEntry {
    return new MotorPlaygroundEntry(
      Motor.fromIdentifier(d.motor.name, d.motor.quantity),
      Measurement.fromDict(d.currentLimit),
      Measurement.fromDict(d.voltage),
      Ratio.fromDict(d.ratio),
      d.visibilityOptions,
    );
  }

  eq<M extends Model>(m: M): boolean {
    return (
      m instanceof MotorPlaygroundEntry && isEqual(this.toDict(), m.toDict())
    );
  }
}

export type MotorPlaygroundListDict = {
  readonly entries: MotorPlaygroundEntryDict[];
};

export default class MotorPlaygroundList extends Model {
  public readonly entries: MotorPlaygroundEntry[];

  constructor(entries: MotorPlaygroundEntry[]) {
    super("MotorPlaygroundList");
    this.entries = entries;
  }

  datasets(): EzDataset[] {
    return this.entries.flatMap((e) => e.datasets());
  }

  toDict(): MotorPlaygroundListDict {
    return {
      entries: this.entries.map((e) => e.toDict()),
    };
  }

  static fromDict(d: MotorPlaygroundListDict): MotorPlaygroundList {
    return new MotorPlaygroundList(
      d.entries.map((e) => MotorPlaygroundEntry.fromDict(e)),
    );
  }

  eq<M extends Model>(m: M): boolean {
    return (
      m instanceof MotorPlaygroundList && isEqual(this.toDict(), m.toDict())
    );
  }

  replaceEntry(
    oldEntry: MotorPlaygroundEntry,
    newEntry: MotorPlaygroundEntry,
  ): MotorPlaygroundList {
    for (let i = 0; i < this.entries.length; i++) {
      if (this.entries[i].eq(oldEntry)) {
        return new MotorPlaygroundList([
          ...this.entries.slice(0, i),
          newEntry,
          ...this.entries.slice(i + 1),
        ]);
      }
    }

    return this;
  }
}
