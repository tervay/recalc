import {
  HasChoices,
  HasStateHook,
  L1ControlledNumberProps,
  L1ControlledSelectProps,
  NumberConvertible,
  StringConvertible,
} from "common/components/io/new/inputs/types/Types";
import { Exclude } from "ts-toolbelt/out/Object/Exclude";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RemoveStateHook<T extends HasStateHook<any>> = Omit<T, "stateHook">;

export type RemoveL1SelectCreationFns<T> = Exclude<
  L1ControlledSelectProps<T>,
  StringConvertible<T> & HasChoices
>;
export type RemoveL1NumberCreationFns<T> = Exclude<
  L1ControlledNumberProps<T>,
  NumberConvertible<T>
>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type RemoveL2NumberSelectCreationFnsAndChoices<
  T extends NumberConvertible<any> & StringConvertible<any>
> = Exclude<T, NumberConvertible<any> & StringConvertible<any> & HasChoices>;
/* eslint-enable @typescript-eslint/no-explicit-any */
