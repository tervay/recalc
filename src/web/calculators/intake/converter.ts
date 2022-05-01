import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import intakeConfig, { IntakeParamsV1 } from "web/calculators/intake";

export class IntakeState {
  static getState(): BaseState {
    if (intakeConfig.version === undefined) {
      throw Error("Config did not set version! " + intakeConfig.url);
    }

    return StateMaker.BumpState(intakeConfig.version, [IntakeParamsV1], []);
  }
}
