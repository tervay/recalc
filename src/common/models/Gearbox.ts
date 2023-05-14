import max from "lodash/max";

export class Stage {
  constructor(
    public readonly driving: number,
    public readonly driven: number,
    public readonly motionSource: string
  ) {}

  getRatio(): number {
    return this.driven / max([1, this.driving])!;
  }

  getMax(): number {
    return this.driven > this.driving ? this.driven : this.driving;
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

  containsPinionsInBadPlaces(): boolean {
    if (this.stages.length === 1) {
      return false;
    }

    for (let i = 1; i < this.stages.length; i++) {
      if (this.stages[i].driving < 14 || this.stages[i].driven < 14) {
        return true;
      }
    }

    return false;
  }

  toObj(): { driven: number; driving: number; motionSource: string }[] {
    return this.stages.map((s) => ({
      driven: s.driven,
      driving: s.driving,
      motionSource: s.motionSource,
    }));
  }

  static fromObj(
    obj: { driven: number; driving: number; motionSource: string }[]
  ) {
    return new Gearbox(
      obj.map((o) => new Stage(o.driving, o.driven, o.motionSource))
    );
  }

  compare(gb: Gearbox, targetReduction: number): number {
    const error = Math.abs(this.getRatio() - targetReduction);
    const otherError = Math.abs(gb.getRatio() - targetReduction);

    return (
      error - otherError ||
      this.getStages() - gb.getStages() ||
      this.getMax() - gb.getMax()
    );
  }
}
