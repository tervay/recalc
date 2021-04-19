import Model from "common/models/Model";

export default class Ratio extends Model {
  static get REDUCTION() {
    return "Reduction";
  }
  static get STEP_UP() {
    return "Step-up";
  }

  /**
   *
   * @param {number} magnitude - Magnitude of the ratio
   * @param {string} ratioType - Either "Reduction" or "Step-up"
   */
  constructor(magnitude, ratioType = Ratio.REDUCTION) {
    super();
    this.magnitude = magnitude;
    this.ratioType = ratioType;

    if (
      ratioType !== undefined &&
      ratioType !== Ratio.REDUCTION &&
      ratioType !== Ratio.STEP_UP
    ) {
      throw TypeError("Invalid ratio type: " + String(ratioType));
    }
  }

  /**
   *
   * @returns {number} Returns the ratio as a X:1 reduction number
   */
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

  eq(other) {
    if (!(other instanceof Ratio)) {
      return false;
    }

    return (
      other.magnitude === this.magnitude && other.ratioType === this.ratioType
    );
  }
}
