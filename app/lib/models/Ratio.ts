import { isEqual } from 'es-toolkit';

import Model from '~/lib/models/Model';

export enum RatioType {
  REDUCTION = 'Reduction',
  STEP_UP = 'Step-up',
}

export type RatioDict = {
  readonly magnitude: number;
  readonly ratioType: RatioType;
};

export default class Ratio extends Model {
  constructor(
    public readonly magnitude: number,
    public readonly ratioType: RatioType = RatioType.REDUCTION,
  ) {
    super('Ratio');
  }

  asNumber(): number {
    return this.magnitude === 0 || this.ratioType === RatioType.REDUCTION
      ? this.magnitude
      : 1.0 / this.magnitude;
  }

  inverse(): Ratio {
    return new Ratio(
      this.magnitude,
      this.ratioType === RatioType.REDUCTION
        ? RatioType.STEP_UP
        : RatioType.REDUCTION,
    );
  }

  toDict(): RatioDict {
    return {
      magnitude: this.magnitude,
      ratioType: this.ratioType,
    };
  }

  to(ratioType: RatioType): Ratio {
    return ratioType == this.ratioType
      ? this
      : new Ratio(1 / this.magnitude, ratioType);
  }

  static fromDict(d: RatioDict): Ratio {
    return new Ratio(d.magnitude, d.ratioType);
  }
  eq(m: Model): boolean {
    return m instanceof Ratio && isEqual(m.toDict(), this.toDict());
  }

  toString(): string {
    if (this.ratioType === RatioType.REDUCTION) {
      return `${this.magnitude}:1`;
    }
    return `1:${this.magnitude}`;
  }
}
