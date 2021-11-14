import { BaseState } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import chainConfig, { ChainParamsV1 } from "web/calculators/chain";

export class Converters {}

export class ChainState {
  static getState(): BaseState {
    if (chainConfig.version === undefined) {
      throw Error("Config did not set version! " + chainConfig.url);
    }

    return StateMaker.BumpState(chainConfig.version, [ChainParamsV1], []);
  }
}
