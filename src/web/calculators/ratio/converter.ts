import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import ratioConfig, { RatioParamsV1 } from "web/calculators/ratio";

export class RatioPairState {
  static getState(): BaseState {
    if (ratioConfig.version === undefined) {
      throw Error("Config did not set version! " + ratioConfig.url);
    }

    return StateMaker.BumpState(ratioConfig.version, [RatioParamsV1], []);
  }
}
