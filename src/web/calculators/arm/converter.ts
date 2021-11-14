import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import armConfig, { ArmParamsV1 } from "web/calculators/arm";

export class ArmState {
  static getState(): BaseState {
    if (armConfig.version === undefined) {
      throw Error("Config did not set version! " + armConfig.url);
    }

    return StateMaker.BumpState(armConfig.version, [ArmParamsV1], []);
  }
}
