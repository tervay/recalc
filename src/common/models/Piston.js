import Measurement from "common/models/Measurement";
import Model from "common/models/Model";
import { ArgumentError } from "common/tooling/errors";

export default class Piston extends Model {
  /**
   *
   * @param {bool} enabled - Whether the piston is enabled or not
   * @param {Measurement} bore - Diameter of the piston bore
   * @param {Measurement} rodDiameter - Diameter of the actuating rod of the piston
   * @param {Measurement} strokeLength - How much the piston extends
   * @param {Measurement} pullPressure - Working pressure of pull action
   * @param {Measurement} pushPressure - Working pressure of push action
   * @param {Measurement} period - How often the piston actuates
   */
  constructor({
    enabled,
    bore,
    rodDiameter,
    strokeLength,
    pullPressure,
    pushPressure,
    period,
  }) {
    super();
    this.enabled = enabled;
    this.bore = bore;
    this.rodDiameter = rodDiameter;
    this.strokeLength = strokeLength;
    this.pullPressure = pullPressure;
    this.pushPressure = pushPressure;
    this.period = period;

    if (
      [
        enabled,
        bore,
        rodDiameter,
        strokeLength,
        pullPressure,
        pushPressure,
        period,
      ].some((p) => p === undefined)
    ) {
      throw new ArgumentError("Provided undefined for a parameter to Piston!");
    }
  }

  /**
   *
   * @param {Measurement} pressure - how much pressure is in the system at time of actuation
   * @returns {Measurement} How much force the pushing action exerts
   */
  getPushForce(pressure) {
    const boreRadius = this.bore.div(2);
    const boreArea = boreRadius.mul(boreRadius).mul(Math.PI);
    return boreArea.mul(pressure);
  }

  /**
   *
   * @param {Measurement} pressure - how much pressure is in the system at time of actuation
   * @returns {Measurement} How much force the pulling action exerts
   */
  getPullForce(pressure) {
    const boreRadius = this.bore.div(2);
    const boreArea = boreRadius.mul(boreRadius).mul(Math.PI);
    const shaftRadius = this.rodDiameter.div(2);
    const shaftArea = shaftRadius.mul(shaftRadius).mul(Math.PI);
    return boreArea.sub(shaftArea).mul(pressure);
  }

  toDict() {
    return {
      enabled: this.enabled,
      bore: this.bore.toDict(),
      rodDiameter: this.rodDiameter.toDict(),
      strokeLength: this.strokeLength.toDict(),
      pullPressure: this.pullPressure.toDict(),
      pushPressure: this.pushPressure.toDict(),
      period: this.period.toDict(),
    };
  }

  static fromDict(dict) {
    return new Piston({
      enabled: dict.enabled,
      bore: Measurement.fromDict(dict.bore),
      rodDiameter: Measurement.fromDict(dict.rodDiameter),
      strokeLength: Measurement.fromDict(dict.strokeLength),
      pullPressure: Measurement.fromDict(dict.pullPressure),
      pushPressure: Measurement.fromDict(dict.pushPressure),
      period: Measurement.fromDict(dict.period),
    });
  }
}
