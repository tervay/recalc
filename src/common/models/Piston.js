import { DictToQty, QtyToDict } from "common/tooling/query-strings";
import { decodeJson, encodeJson } from "use-query-params";

export default class Piston {
  constructor({
    enabled,
    bore,
    rodDiameter,
    strokeLength,
    pullPressure,
    pushPressure,
    period,
  }) {
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
      bore: this.bore,
      rodDiameter: this.rodDiameter,
      strokeLength: this.strokeLength,
      pullPressure: this.pullPressure,
      pushPressure: this.pushPressure,
      period: this.period,
    };
  }

  static fromDict(dict) {
    return new Piston(dict);
  }

  static encode(piston) {
    const dict = piston.toDict();
    [
      "bore",
      "rodDiameter",
      "strokeLength",
      "pullPressure",
      "pushPressure",
      "period",
    ].forEach((k) => {
      dict[k] = QtyToDict(dict[k]);
    });

    return encodeJson(dict);
  }

  static decode(string) {
    const decoded = decodeJson(string);

    [
      "bore",
      "rodDiameter",
      "strokeLength",
      "pullPressure",
      "pushPressure",
      "period",
    ].forEach((k) => {
      decoded[k] = DictToQty(decoded[k]);
    });

    return new Piston(decoded);
  }

  static getParam() {
    return {
      encode: Piston.encode,
      decode: Piston.decode,
    };
  }
}
