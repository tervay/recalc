import { BaseState, ConversionFn } from "common/models/ExtraTypes";
import Pulley from "common/models/Pulley";
import { StateMaker } from "common/tooling/conversion";
import beltsConfig, {
  BeltParamsV2,
  BeltsParamsV1,
  BeltsStateV1,
  BeltStateV2,
} from "web/calculators/belts";

export class Converters {
  static v1ToV2: ConversionFn<BeltsStateV1, BeltStateV2> = (s) => {
    return {
      pulley: Pulley.fromTeeth(s.p1Teeth, s.pitch),
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
      [Converters.v1ToV2]
    );
  }
}
