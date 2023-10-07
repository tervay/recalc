/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseState, ConversionFn, Setters } from "common/models/ExtraTypes";
import qs from "query-string";
import { useState } from "react";
import {
  NumberParam,
  QueryParamConfigMap,
  decodeQueryParams,
  encodeQueryParams,
  withDefault,
} from "serialize-query-params";

const pascalCase = (s: string) => s[0].toUpperCase() + s.slice(1);

export function useGettersSetters<T extends BaseState>(
  state: T,
): [T, Setters<T>] {
  const getters: T = {} as T;
  const setters: Setters<T> = {} as Setters<T>;
  Object.keys(state).map((k) => {
    const [val, setVal] = useState((state as any)[k]);
    (setters as any)[`set${pascalCase(k)}`] = setVal;
    (getters as any)[k] = val;
  });

  return [getters, setters];
}

export function URLifier<State extends BaseState>(
  q: QueryParamConfigMap,
  s: State,
): string {
  return qs.stringify(encodeQueryParams(q, s));
}

export class StateMaker {
  static Convert<
    BV extends BaseState,
    V1 extends BaseState,
    V2 extends BaseState,
  >(s: BV, a: ConversionFn<V1, V2>[]): BV {
    a.forEach((f) => {
      s = f(s as any) as any;
    });

    return s;
  }

  static BumpState<A extends BaseState, B extends BaseState>(
    version: number,
    params: QueryParamConfigMap[],
    converters: ConversionFn<A, B>[],
  ): BaseState {
    let url_version = decodeQueryParams(
      { version: withDefault(NumberParam, version) },
      qs.parse(location.search),
    ).version;

    if (url_version === undefined) {
      throw Error("Could not find url version from " + params.toString());
    }

    const urlState = decodeQueryParams(
      params[url_version - 1],
      qs.parse(location.search),
    );
    let state = urlState;

    while (url_version < version) {
      state = StateMaker.Convert(urlState, [converters[url_version - 1]]);
      url_version++;
    }

    return state;
  }
}
