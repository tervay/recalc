import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import linearConfig, { LinearParamsV1 } from "web/calculators/linear";

export class LinearState {
  static getState(): BaseState {
    if (linearConfig.version === undefined) {
      throw Error("Config did not set version! " + linearConfig.url);
    }

    return StateMaker.BumpState(linearConfig.version, [LinearParamsV1], []);
  }
}
