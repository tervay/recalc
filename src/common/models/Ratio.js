import Model from "common/tooling/abc/Model";

export default class Ratio extends Model {
  static get REDUCTION() {
    return "Reduction";
  }
  static get STEP_UP() {
    return "Step-up";
  }

  constructor(magnitude, ratioType) {
    super();
    this.magnitude = magnitude;
    this.ratioType = ratioType || Ratio.REDUCTION;

    if (
      ratioType !== undefined &&
      ratioType !== Ratio.REDUCTION &&
      ratioType !== Ratio.STEP_UP
    ) {
      throw TypeError("Invalid ratio type: " + String(ratioType));
    }
  }

  asNumber() {
    if (this.magnitude === 0 || this.ratioType === Ratio.REDUCTION) {
      return this.magnitude;
    } else {
      return 1.0 / this.magnitude;
    }
  }

  toDict() {
    return {
      magnitude: this.magnitude,
      ratioType: this.ratioType,
    };
  }

  static fromDict(dict) {
    return new Ratio(dict.magnitude, dict.ratioType);
  }
}
