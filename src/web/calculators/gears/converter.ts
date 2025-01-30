import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import gearConfig, { GearParamsV1 } from "web/calculators/gears";

export class GearState {
  static getState(): BaseState {
    if (gearConfig.version === undefined) {
      throw Error("Config did not set version! " + gearConfig.url);
    }

    return StateMaker.BumpState(gearConfig.version, [GearParamsV1], []);
  }
}
