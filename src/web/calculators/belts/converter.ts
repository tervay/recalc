import { BaseState, ConversionFn } from "common/models/ExtraTypes";
import { SimplePulley } from "common/models/Pulley";
import type Pulley from "common/models/Pulley";
import { StateMaker } from "common/tooling/conversion";
import beltsConfig, {
  BeltParamsV2,
  BeltStateV2,
  BeltsParamsV1,
  BeltsStateV1,
} from "web/calculators/belts";

export class Converters {
  static v1ToV2: ConversionFn<BeltsStateV1, BeltStateV2> = (s) => {
    return {
      pulley: new SimplePulley(s.p1Teeth, s.pitch) as Pulley,
    };
  };
}

export class BeltState {
  static getState(): BaseState {
    if (beltsConfig.version === undefined) {
      throw Error("Config did not set version! " + beltsConfig.url);
    }

    return StateMaker.BumpState(
      beltsConfig.version,
      [BeltsParamsV1, BeltParamsV2],
      [Converters.v1ToV2],
    );
  }
}
