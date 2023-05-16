import { Bore, FRCVendor } from "common/models/ExtraTypes";
import { MeasurementDict } from "common/models/Measurement";
import { min } from "lodash";
import max from "lodash/max";

export type PulleyData = {
  type: "HTD" | "GT2" | "RT25";
  teeth: number;
  pitch: MeasurementDict;
  bore: Bore;
  vendor: FRCVendor;
  url: string;
  partNumber: string;
};

export type SprocketData = {
  type: "#25" | "#35";
  teeth: number;
  bore: Bore;
  vendor: FRCVendor;
  url: string;
  partNumber: string;
};

export type GearData = {
  dp: number;
  teeth: number;
  bore: Bore;
  vendor: FRCVendor;
  url: string;
  partNumber: string;
};

export type MotionMethod = (PulleyData | SprocketData | GearData) & {
  type: "Gear" | "Pulley" | "Sprocket";
};

export class Stage {
  constructor(
    public readonly driving: MotionMethod,
    public readonly driven: MotionMethod
  ) {}

  getRatio(): number {
    return this.driven.teeth / max([1, this.driving.teeth])!;
  }

  getMax(): number {
    return this.driven.teeth > this.driving.teeth
      ? this.driven.teeth
      : this.driving.teeth;
  }

  getMin(): number {
    return this.driven.teeth < this.driving.teeth
      ? this.driven.teeth
      : this.driving.teeth;
  }
}

export class Gearbox {
  constructor(public stages: Stage[]) {}

  addStage(stage: Stage) {
    this.stages.push(stage);
  }

  getRatio(): number {
    return this.stages.reduce((prev, curr) => prev * curr.getRatio(), 1);
  }

  getStages(): number {
    return this.stages.length;
  }

  getMax(): number {
    return max(this.stages.map((s) => s.getMax())) || 1000;
  }

  getMin(): number {
    return min(this.stages.map((s) => s.getMin())) || 0;
  }

  containsPinionsInBadPlaces(): boolean {
    if (this.stages.length === 1) {
      return false;
    }

    for (let i = 1; i < this.stages.length; i++) {
      if (
        ["Falcon", "NEO", "550", "775"].includes(this.stages[i].driving.bore) ||
        ["Falcon", "NEO", "550", "775"].includes(this.stages[i].driven.bore)
      ) {
        return true;
      }
    }

    return false;
  }

  containsFirstPartPinion(): boolean {
    return ["Falcon", "NEO", "550", "775"].includes(
      this.stages[0].driving.bore
    );
  }

  toObj(): {
    driven: MotionMethod;
    driving: MotionMethod;
  }[] {
    return this.stages.map((s) => ({
      driven: s.driven,
      driving: s.driving,
    }));
  }

  static fromObj(obj: { driven: MotionMethod; driving: MotionMethod }[]) {
    return new Gearbox(obj.map((o) => new Stage(o.driving, o.driven)));
  }

  compare(gb: Gearbox, targetReduction: number): number {
    const error = Math.abs(this.getRatio() - targetReduction);
    const otherError = Math.abs(gb.getRatio() - targetReduction);

    return (
      error - otherError ||
      // this.getMin() - gb.getMin() ||
      this.getStages() - gb.getStages() ||
      this.getMax() - gb.getMax()
    );
  }
}

export class Stage2 {
  constructor(
    public readonly driving: number,
    public readonly driven: number,
    public drivingMethods: MotionMethod[],
    public drivenMethods: MotionMethod[]
  ) {}

  getRatio(): number {
    return this.driven / max([1, this.driving])!;
  }

  getMax(): number {
    return this.driven > this.driving ? this.driven : this.driving;
  }

  getMin(): number {
    return this.driven < this.driving ? this.driven : this.driving;
  }
}

export class Gearbox2 {
  constructor(public stages: Stage2[]) {}

  addStage(stage: Stage2) {
    this.stages.push(stage);
  }

  getRatio(): number {
    return this.stages.reduce((prev, curr) => prev * curr.getRatio(), 1);
  }

  getStages(): number {
    return this.stages.length;
  }

  getMax(): number {
    return max(this.stages.map((s) => s.getMax())) || 1000;
  }

  getMin(): number {
    return min(this.stages.map((s) => s.getMin())) || 0;
  }

  containsPinionInGoodPlace(): boolean {
    return (
      this.stages[0].drivingMethods.filter((m) =>
        ["Falcon", "NEO", "550", "775"].includes(m.bore)
      ).length > 0
    );
  }

  containsPinionInBadPlace(): boolean {
    if (this.stages.length === 1) {
      return false;
    }

    for (let i = 1; i < this.stages.length; i++) {
      let nonPinions = this.stages[i].drivingMethods.filter(
        (m) => m.bore === "1/2 Hex" || m.bore === "3/8 Hex"
      );

      // console.log(i, this.stages[i]);
      if (nonPinions.length === 0) {
        return true;
      }
    }

    console.log("good on " + this.stages);
    return false;
  }

  overlapsBores(): boolean {
    if (this.stages.length === 1) {
      return true;
    }

    for (let i = 0; i < this.stages.length - 1; i++) {
      for (
        let boreIdx = 0;
        boreIdx < this.stages[i].drivenMethods.length;
        boreIdx++
      ) {
        for (
          let matingBoreIdx = 0;
          matingBoreIdx < this.stages[i + 1].drivingMethods.length;
          matingBoreIdx++
        ) {
          if (
            this.stages[i].drivenMethods[boreIdx].bore ===
            this.stages[i + 1].drivingMethods[matingBoreIdx].bore
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  toObj(): {
    driven: number;
    driving: number;
    drivingMethods: MotionMethod[];
    drivenMethods: MotionMethod[];
  }[] {
    return this.stages.map((s) => ({
      driven: s.driven,
      driving: s.driving,
      drivingMethods: s.drivingMethods,
      drivenMethods: s.drivenMethods,
    }));
  }

  static fromObj(
    obj: {
      driven: number;
      driving: number;
      drivingMethods: MotionMethod[];
      drivenMethods: MotionMethod[];
    }[]
  ) {
    return new Gearbox2(
      obj.map(
        (o) =>
          new Stage2(o.driving, o.driven, o.drivingMethods, o.drivenMethods)
      )
    );
  }

  compare(gb: Gearbox2, targetReduction: number): number {
    const error = Math.abs(this.getRatio() - targetReduction);
    const otherError = Math.abs(gb.getRatio() - targetReduction);

    return (
      error - otherError ||
      // this.getMin() - gb.getMin() ||
      this.getStages() - gb.getStages() ||
      this.getMax() - gb.getMax()
    );
  }
}
