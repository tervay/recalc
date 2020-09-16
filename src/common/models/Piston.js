import Model from "common/tooling/abc/Model";
import { DictToQty, QtyToDict } from "common/tooling/query-strings";

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
      bore: QtyToDict(this.bore),
      rodDiameter: QtyToDict(this.rodDiameter),
      strokeLength: QtyToDict(this.strokeLength),
      pullPressure: QtyToDict(this.pullPressure),
      pushPressure: QtyToDict(this.pushPressure),
      period: QtyToDict(this.period),
    };
  }

  static fromDict(dict) {
    console.log(dict);
    return new Piston({
      enabled: dict.enabled,
      bore: DictToQty(dict.bore),
      rodDiameter: DictToQty(dict.rodDiameter),
      strokeLength: DictToQty(dict.strokeLength),
      pullPressure: DictToQty(dict.pullPressure),
      pushPressure: DictToQty(dict.pushPressure),
      period: DictToQty(dict.period),
    });
  }
}
