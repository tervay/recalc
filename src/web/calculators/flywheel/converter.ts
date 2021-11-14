import { BaseState, ConversionFn } from "common/models/ExtraTypes";
import { StateMaker } from "common/tooling/conversion";
import flywheelConfig, {
  FlywheelParamsV1,
  FlywheelParamsV2,
  FlywheelStateV1,
  FlywheelStateV2,
  FlywheelStateV2Defaults,
} from "web/calculators/flywheel";

export class FlywheelConverters {
  static v1ToV2: ConversionFn<FlywheelStateV1, FlywheelStateV2> = (s) => {
    return {
      shooterRadius: s.radius,
      shooterMomentOfInertia: s.momentOfInertia,
      shooterTargetSpeed: s.targetSpeed,
      shooterWeight: s.weight,
      useCustomShooterMoi: s.useCustomMoi,
      motor: s.motor,
      motorRatio: s.ratio,
      currentLimit: FlywheelStateV2Defaults.currentLimit,
      flywheelRadius: FlywheelStateV2Defaults.flywheelRadius,
      flywheelMomentOfInertia: FlywheelStateV2Defaults.flywheelMomentOfInertia,
      flywheelRatio: FlywheelStateV2Defaults.flywheelRatio,
      flywheelWeight: FlywheelStateV2Defaults.flywheelWeight,
      projectileRadius: FlywheelStateV2Defaults.projectileRadius,
      projectileWeight: FlywheelStateV2Defaults.projectileWeight,
      useCustomFlywheelMoi: FlywheelStateV2Defaults.useCustomFlywheelMoi,
    };
  };
}

export class FlywheelState {
  static getState(): BaseState {
    if (flywheelConfig.version === undefined) {
      throw Error("Config did not set version! " + flywheelConfig.url);
    }

    return StateMaker.BumpState(
      flywheelConfig.version,
      [FlywheelParamsV1, FlywheelParamsV2],
      [FlywheelConverters.v1ToV2]
    );
  }
}

// export function Foo<K extends Motor | Measurement, T extends Record<string, K>>(
//   defaults: T
// ): ParamifyDefaults<T> {
//   return Object.entries(defaults).reduce(
//     (acc, [k, v]) => ({
//       ...acc,
//       [k]: withDefault(v instanceof Motor ? MotorParam : MeasurementParam, v),
//     }),
//     {} as ParamifyDefaults<T>
//   );
// }
