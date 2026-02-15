import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import beltsConfig, { BeltsParamsV1 } from "web/calculators/belts";

export class BeltState {
  static getState(): BaseState {
    if (beltsConfig.version === undefined) {
      throw Error("Config did not set version! " + beltsConfig.url);
    }

    return StateMaker.BumpState(beltsConfig.version, [BeltsParamsV1], []);
  }
}
