import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import driveConfig, { DriveParamsV1 } from "web/calculators/drive";

export class DriveState {
  static getState(): BaseState {
    if (driveConfig.version === undefined) {
      throw Error("Config did not set version! " + driveConfig.url);
    }

    return StateMaker.BumpState(driveConfig.version, [DriveParamsV1], []);
  }
}
