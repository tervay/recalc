import Qty from "common/models/Qty";
import Model from "common/tooling/abc/Model";

export default class Piston extends Model {
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
  }

  getPushForce(pressure) {
    const boreRadius = this.bore.div(2);
    const boreArea = boreRadius.mul(boreRadius).mul(Math.PI);
    return boreArea.mul(pressure);
  }

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
      bore: Qty.fromDict(dict.bore),
      rodDiameter: Qty.fromDict(dict.rodDiameter),
      strokeLength: Qty.fromDict(dict.strokeLength),
      pullPressure: Qty.fromDict(dict.pullPressure),
      pushPressure: Qty.fromDict(dict.pushPressure),
      period: Qty.fromDict(dict.period),
    });
  }
}
