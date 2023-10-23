import {
  RemoveL1NumberCreationFns,
  RemoveL1SelectCreationFns,
  RemoveL2NumberSelectCreationFnsAndChoices,
  RemoveStateHook,
} from "common/components/io/new/inputs/types/Utility";
import Chain from "common/models/Chain";
import Compressor from "common/models/Compressor";
import { Bore, StateHook } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import { ReactNode } from "react";
import { Exclude } from "ts-toolbelt/out/Object/Exclude";
import { Intersect } from "ts-toolbelt/out/Object/Intersect";
import { Required } from "ts-toolbelt/out/Object/Required";

type InputColor =
  | "primary"
  | "link"
  | "info"
  | "success"
  | "warning"
  | "danger";
type InputSize = "small" | "normal" | "medium" | "large";

export type Colorable = {
  [C in InputColor as `${C}If`]: () => boolean;
};

export type Loadable = {
  loadingIf: () => boolean;
};

export type Sizable = {
  size: InputSize;
};

export type Roundable = {
  rounded: boolean;
};

export type Disableable = {
  disabledIf: () => boolean;
};

export type OtherStylable = {
  static: boolean;
  readonly: boolean;
};

type Identifiable = {
  id: string;
};

export type HasStateHook<T> = {
  stateHook: StateHook<T>;
};

export type StringConvertible<T> = {
  makeString: (t: T) => string;
  fromString: (s: string) => T;
};

export type NumberConvertible<T> = {
  makeNumber: (t: T) => number;
  fromNumber: (n: number) => T;
};

export type HasChoices = {
  choices: string[];
};

export type HasChildren = {
  children: ReactNode;
};

export type Expandable = {
  expanded: boolean;
};

type Delayable = {
  delay: number;
};

type NumericallyRoundable = {
  roundTo: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SetAllFieldsButStateHookOptional<T extends HasStateHook<any>> =
  Required<Partial<T>, "stateHook">;

type Controllable = Expandable & {
  skipControl: boolean;
};
export type ControlFieldProps = HasChildren & Controllable;

// L0
export type L0SelectProps = Identifiable &
  HasStateHook<string> &
  Sizable &
  Loadable &
  Roundable &
  Colorable &
  HasChoices;
export type L0NumberProps = Identifiable &
  HasStateHook<number> &
  Sizable &
  Roundable &
  //   Loadable &
  Colorable &
  Disableable &
  OtherStylable &
  Delayable &
  NumericallyRoundable;
export type L0BooleanProps = Identifiable & HasStateHook<boolean>;

// L1
export type L1ControlledSelectProps<T> = RemoveStateHook<L0SelectProps> &
  HasStateHook<T> &
  StringConvertible<T> &
  Controllable;
export type L1ControlledNumberProps<T> = RemoveStateHook<L0NumberProps> &
  HasStateHook<T> &
  NumberConvertible<T> &
  Loadable &
  Controllable;

// L2
type _SharedBetweenNumberAndSelectProps<T> = Omit<
  Intersect<L1ControlledNumberProps<T>, L1ControlledSelectProps<T>>,
  "id"
>;
type _UniquelyNumberProps<T> = Exclude<
  RemoveL1NumberCreationFns<L1ControlledNumberProps<T>>,
  _SharedBetweenNumberAndSelectProps<T>
>;
type _UniquelySelectProps<T> = Exclude<
  RemoveL1SelectCreationFns<L1ControlledSelectProps<T>>,
  _SharedBetweenNumberAndSelectProps<T>
>;
type _L2NumberSelect_SelectProps<T> = {
  [Prop in keyof _UniquelySelectProps<T> as `select${Capitalize<Prop>}`]: _UniquelySelectProps<T>[Prop];
};
type _L2NumberSelect_NumberProps<T> = {
  [Prop in keyof _UniquelyNumberProps<T> as `number${Capitalize<Prop>}`]: _UniquelyNumberProps<T>[Prop];
};
export type _L2NumberSelectProps_Required<T> = _L2NumberSelect_NumberProps<T> &
  _L2NumberSelect_SelectProps<T> &
  _SharedBetweenNumberAndSelectProps<T>;

export type L2NumberSelectProps<T> = SetAllFieldsButStateHookOptional<
  _L2NumberSelectProps_Required<T>
> &
  NumberConvertible<T> &
  StringConvertible<T> &
  HasChoices;

// L3
export type BooleanInputProps =
  SetAllFieldsButStateHookOptional<L0BooleanProps>;

export type NumberInputProps = SetAllFieldsButStateHookOptional<
  RemoveL1NumberCreationFns<number>
>;

export type CompressorInputProps = SetAllFieldsButStateHookOptional<
  RemoveL1SelectCreationFns<Compressor>
>;

export type ChainInputProps = SetAllFieldsButStateHookOptional<
  RemoveL1SelectCreationFns<Chain>
>;

export type BoreInputProps = SetAllFieldsButStateHookOptional<
  RemoveL1SelectCreationFns<Bore>
>;

export type MeasurementInputProps = RemoveL2NumberSelectCreationFnsAndChoices<
  L2NumberSelectProps<Measurement>
> & {
  defaultUnit?: string;
};

export type MotorInputProps = RemoveL2NumberSelectCreationFnsAndChoices<
  L2NumberSelectProps<Motor>
>;

export type RatioInputProps = RemoveL2NumberSelectCreationFnsAndChoices<
  L2NumberSelectProps<Ratio>
>;
