import {
  Bore,
  ChainType,
  FRCVendor,
  MotorBores,
  PulleyBeltType,
} from "common/models/ExtraTypes";
import { MeasurementDict } from "common/models/Measurement";
import fastCartesian from "fast-cartesian";
import { min } from "lodash";
import max from "lodash/max";

export type DrivingDriven = { driving: MotionMethod[]; driven: MotionMethod[] };

type BaseMotionMethod = {
  teeth: number;
  bore: Bore;
  vendor: FRCVendor;
  url: string;
  partNumber: string;
};

export type PulleyData = BaseMotionMethod & {
  beltType: PulleyBeltType;
  pitch: MeasurementDict;
};

export type SprocketData = BaseMotionMethod & {
  chainType: ChainType;
};

export type GearData = BaseMotionMethod & {
  dp: number;
};

export type PlanetaryData = BaseMotionMethod & {
  stageSequence?: number[];
};

export type MotionMethodPart = "Gear" | "Pulley" | "Sprocket" | "Planetary";
export type MotionMethod = BaseMotionMethod & {
  type: MotionMethodPart;
};

export function MMTypeStr(mm: MotionMethod): string {
  let typeStr = "";
  if (mm.type === "Gear") {
    typeStr = `${(mm as any as GearData).dp} DP`;
  } else if (mm.type === "Pulley") {
    typeStr = (mm as any as PulleyData).beltType;
  } else if (mm.type === "Sprocket") {
    typeStr = (mm as any as SprocketData).chainType;
  } else if (mm.type === "Planetary") {
    const pd = mm as any as PlanetaryData;
    if (pd.stageSequence === undefined) {
      typeStr = "Planetary";
    } else {
      if (pd.stageSequence.length === 1) {
        typeStr = `${pd.stageSequence[0]}:1`;
      } else {
        typeStr = pd.stageSequence.join("×");
      }
    }
  }
  return typeStr;
}

export type RawPlanetaryData = {
  inputs: Bore[];
  outputs: Bore[];
  ratios: number[];
  maxStages: number;
  partNumber: string;
  url: string;
  vendor: FRCVendor;
};

export class Stage {
  constructor(
    public readonly driving: number,
    public readonly driven: number,
    public drivingMethods: MotionMethod[],
    public drivenMethods: MotionMethod[],
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

export class Planetary extends Stage {
  constructor(
    public readonly reduction: number,
    public readonly stageOptions: number[][],
    planetary: RawPlanetaryData,
  ) {
    super(
      1,
      reduction,
      planetary.inputs.map((input) => ({
        ...({
          bore: input,
          partNumber: planetary.partNumber,
          teeth: reduction,
          type: "Planetary",
          url: planetary.url,
          vendor: planetary.vendor,
          stageSequence: undefined,
        } as PlanetaryData),
        type: "Planetary",
      })),
      fastCartesian([planetary.outputs, stageOptions]).map(
        ([outputBore, stageOption]) => ({
          ...({
            bore: outputBore,
            partNumber: planetary.partNumber,
            teeth: reduction,
            type: "Planetary",
            url: planetary.url,
            vendor: planetary.vendor,
            stageSequence: stageOption,
          } as PlanetaryData),
          type: "Planetary",
        }),
      ),
    );
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

  containsPinionInGoodPlace(): boolean {
    return (
      this.stages[0].drivingMethods.filter((m) => MotorBores.includes(m.bore))
        .length > 0
    );
  }

  startsWithBore(bore: Bore): boolean {
    return (
      this.stages[0].drivingMethods.filter((m) => m.bore === bore).length > 0
    );
  }

  startsWithTeeth(teeth: number): boolean {
    return (
      this.stages[0].drivingMethods.filter((m) => m.teeth === teeth).length > 0
    );
  }

  containsInvalidTeethSizingDueToPoorForesight(
    minTeeth: number,
    maxTeeth: number,
  ) {
    let good = true;
    for (let i = 0; i < this.stages.length; i++) {
      if (i > 0) {
        good =
          good &&
          minTeeth <= this.stages[i].driving &&
          this.stages[i].driving <= maxTeeth;
      }

      good =
        good &&
        minTeeth <= this.stages[i].driven &&
        this.stages[i].driven <= maxTeeth;
    }

    if (!good) {
      console.log("not good", this.stages);
    } else {
      console.log("good", this.stages);
    }

    return !good;
  }

  containsPinionInBadPlace(): boolean {
    if (this.stages.length === 1) {
      return (
        this.stages[0].drivenMethods.filter((m) => !MotorBores.includes(m.bore))
          .length === 0
      );
    }

    for (let i = 1; i < this.stages.length; i++) {
      const nonPinions = this.stages[i].drivingMethods.filter(
        (m) => !MotorBores.includes(m.bore),
      );

      // console.log(i, this.stages[i]);
      if (
        nonPinions.length === 0 ||
        this.stages[i].drivenMethods.filter((m) => !MotorBores.includes(m.bore))
          .length === 0
      ) {
        return true;
      }
    }

    return false;
  }

  filterStagesForOverlappingMotionMethods() {
    this.stages.forEach((stage) => {
      const newDriven: MotionMethod[] = [];
      const newDriving: MotionMethod[] = [];

      stage.drivingMethods.forEach((driving) => {
        const matchingMethod = stage.drivenMethods.filter(
          (driven) =>
            driving.type === driven.type &&
            (driving.type === "Planetary" && driven.type === "Planetary"
              ? true
              : MMTypeStr(driving) === MMTypeStr(driven)),
        );

        if (matchingMethod.length > 0) {
          newDriving.push(driving);

          matchingMethod.forEach((match) => {
            if (!newDriven.includes(match)) {
              newDriven.push(match);
            }
          });
        }
      });

      stage.drivingMethods = newDriving;
      stage.drivenMethods = newDriven;
    });
  }

  filterStagesForOverlappingBores() {
    for (let i = 0; i < this.stages.length - 1; i++) {
      const prevStage = this.stages[i];
      const nextStage = this.stages[i + 1];
      const newPrevDriven: MotionMethod[] = [];
      const newNextDriving: MotionMethod[] = [];

      prevStage.drivenMethods.forEach((driven) => {
        const matchingBores = nextStage.drivingMethods.filter(
          (driving) => driving.bore === driven.bore,
        );

        if (matchingBores.length > 0) {
          newPrevDriven.push(driven);

          matchingBores.forEach((matching) => {
            if (!newNextDriving.includes(matching)) {
              newNextDriving.push(matching);
            }
          });
        }
      });

      prevStage.drivenMethods = newPrevDriven;
      nextStage.drivingMethods = newNextDriving;
    }
  }

  hasMotionModes(): boolean {
    let good = true;
    this.stages.forEach((stage) => {
      if (
        stage.drivenMethods.length === 0 ||
        stage.drivingMethods.length === 0
      ) {
        good = false;
      }
    });

    return good;
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
    }[],
  ) {
    return new Gearbox(
      obj.map(
        (o) =>
          new Stage(o.driving, o.driven, o.drivingMethods, o.drivenMethods),
      ),
    );
  }

  compare(gb: Gearbox, targetReduction: number): number {
    const error = Math.abs(this.getRatio() - targetReduction);
    const otherError = Math.abs(gb.getRatio() - targetReduction);
    // const targetPerStageReduction = Math.pow(
    //   targetReduction,
    //   1 / gb.getStages()
    // );
    // const perStageTotalError = this.stages.reduce(
    //   (prev, curr) =>
    //     prev + Math.abs(targetPerStageReduction - curr.getRatio()),
    //   1
    // );
    // const perStageTotalErrorOther = gb.stages.reduce(
    //   (prev, curr) =>
    //     prev + Math.abs(targetPerStageReduction - curr.getRatio()),
    //   1
    // );

    return (
      error - otherError ||
      // perStageTotalError - perStageTotalErrorOther ||
      this.getStages() - gb.getStages() ||
      this.getMax() - gb.getMax() ||
      this.getMin() - gb.getMin()
    );
  }
}
