import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import ratioFinderConfig, {
  RatioFinderParamsV1,
} from "web/calculators/ratioFinder";

export class RatioFinderState {
  static getState(): BaseState {
    if (ratioFinderConfig.version === undefined) {
      throw Error("Config did not set version! " + ratioFinderConfig.url);
    }

    return StateMaker.BumpState(
      ratioFinderConfig.version,
      [RatioFinderParamsV1],
      []
    );
  }
}
