import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import pneumaticsConfig, {
  PneumaticsParamsV1,
} from "web/calculators/pneumatics";

export class PneumaticsState {
  static getState(): BaseState {
    if (pneumaticsConfig.version === undefined) {
      throw Error("Config did not set version! " + pneumaticsConfig.url);
    }

    return StateMaker.BumpState(
      pneumaticsConfig.version,
      [PneumaticsParamsV1],
      []
    );
  }
}
