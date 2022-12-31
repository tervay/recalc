import Model from "common/models/Model";
import Ratio, { RatioType } from "common/models/Ratio";
import { isEqual } from "lodash";

export type Driving = number;
export type Driven = number;
export type RatioPair = [Driving, Driven];

export type RatioPairDict = {
  pairs: RatioPair[];
};

export default class RatioPairList extends Model {
  constructor(public readonly pairs: RatioPair[]) {
    super("RatioPair");
  }

  toDict(): RatioPairDict {
    return {
      pairs: this.pairs,
    };
  }

  static fromDict(d: RatioPairDict): RatioPairList {
    return new RatioPairList(d.pairs);
  }

  eq<M extends Model>(m: M): boolean {
    return m instanceof RatioPairList && isEqual(m.toDict(), this.toDict());
  }

  replaceInSameSpot(oldPiston: RatioPair, newPiston: RatioPair): RatioPairList {
    for (let i = 0; i < this.pairs.length; i++) {
      if (isEqual(this.pairs[i], oldPiston)) {
        return new RatioPairList([
          ...this.pairs.slice(0, i),
          newPiston,
          ...this.pairs.slice(i + 1),
        ]);
      }
    }

    return this;
  }

  calculateNetRatio(): Ratio {
    return new Ratio(
      this.pairs.reduce((acc, curr) => acc * (curr[0] / curr[1]), 1),
      RatioType.STEP_UP
    );
  }
}
