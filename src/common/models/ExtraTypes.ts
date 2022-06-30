import Belt from "common/models/Belt";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import { MeasurementParam, MotorParam, RatioParam } from "common/models/Params";
import Pulley from "common/models/Pulley";
import Ratio from "common/models/Ratio";
import { Dispatch, SetStateAction } from "react";
import { BooleanParam, QueryParamConfig } from "serialize-query-params";
import { PascalCase } from "type-fest";

export type StateHook<T> = [T, Dispatch<SetStateAction<T>>];

export interface BaseState {
  [k: string]: unknown;
}

interface BaseParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: QueryParamConfig<any>;
}

type Stateify<ParamMap extends BaseParams> = {
  [Name in keyof ParamMap]: ReturnType<ParamMap[Name]["decode"]>;
};

export type ParamifyDefaults<DefaultMap extends BaseState> = {
  [Name in keyof DefaultMap]: DefaultMap[Name] extends Measurement
    ? typeof MeasurementParam
    : DefaultMap[Name] extends Motor
    ? typeof MotorParam
    : DefaultMap[Name] extends Ratio
    ? typeof RatioParam
    : DefaultMap[Name] extends boolean
    ? typeof BooleanParam
    : null;
};

export type UseStateObject<T extends BaseState> = {
  [Prop in keyof T]: StateHook<T[Prop]>;
};

export type SetterStr<Str extends string> = `set${PascalCase<Str>}`;
type Setters<K extends BaseState> = {
  [Prop in keyof K as SetterStr<Prop extends string ? Prop : never>]: Dispatch<
    SetStateAction<K[Prop]>
  >;
};

export type { Setters, Stateify };

export type ConversionFn<VFrom extends BaseState, VTo extends BaseState> = (
  s: VFrom
) => VTo;

export type FRCVendor = "VEXpro" | "WCP" | "AndyMark" | "REV" | "VBeltGuys";
export type PulleyBeltType = "HTD" | "GT2";

// Quick units, mostly for tests
export const mm = (n: number): Measurement => new Measurement(n, "mm");
export const inch = (n: number): Measurement => new Measurement(n, "inch");
export const lb = (n: number): Measurement => new Measurement(n, "lbs");
export const psi = (n: number): Measurement => new Measurement(n, "psi");
export const cfm = (n: number): Measurement => new Measurement(n, "ft^3 / min");
export const A = (n: number): Measurement => new Measurement(n, "A");
export const in2lb = (n: number): Measurement => new Measurement(n, "in^2 lb");
export const rpm = (n: number): Measurement => new Measurement(n, "rpm");
export const s = (n: number): Measurement => new Measurement(n, "s");
export const fps = (n: number): Measurement => new Measurement(n, "ft/s");
export const ul = (n: number): Measurement => new Measurement(n);
export const J = (n: number): Measurement => new Measurement(n, "J");
export const deg = (n: number): Measurement => new Measurement(n, "degrees");
export const V = (n: number): Measurement => new Measurement(n, "V");
export const Nm = (n: number): Measurement => new Measurement(n, "N m");
export const W = (n: number): Measurement => new Measurement(n, "W");

export type JSONable = number | string | Measurement | Belt | Pulley;
