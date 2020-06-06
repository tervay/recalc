import Qty from "js-quantities";
import { parse, stringify } from "query-string";
import {
  decodeArray,
  decodeObject,
  encodeArray,
  encodeObject,
  encodeQueryParams,
  encodeBoolean,
} from "use-query-params";
import { motorMap } from "./motors";

function QtyToDict(qty) {
  return {
    s: qty.scalar,
    u: qty.units(),
  };
}

function DictToQty(dict) {
  return Qty(Number(dict.s), dict.u);
}

function MotorToDict(motor) {
  return {
    name: motor.data.name,
    quantity: motor.quantity,
  };
}

function DictToMotor(dict) {
  return {
    quantity: Number(dict.quantity),
    data: motorMap[dict.name],
  };
}

export const QtyParam = {
  encode: (qty) => {
    return encodeObject(QtyToDict(qty));
  },
  decode: (str) => {
    return DictToQty(decodeObject(str));
  },
};

export const PistonParam = {
  encode: (piston) => {
    const a = encodeArray(
      Object.keys(piston).map((k) => {
        if (k instanceof Object) {
          return encodeObject({
            name: k,
            value: QtyParam.encode(piston[k]).replace("_", "|"),
          });
        } else {
          return encodeBoolean(piston[k]);
        }
      })
    );
    return a;
  },
  decode: (str) => {
    const obj = decodeArray(str);
    return Object.assign(
      ...obj.map((s) => {
        const d = decodeObject(s);
        return {
          [d.name]: QtyParam.decode(d.value.replace("|", "_")),
        };
      })
    );
  },
};

export const MotorParam = {
  encode: (motor) => encodeObject(MotorToDict(motor)),
  decode: (str) => DictToMotor(decodeObject(str)),
};

export class QueryableParamHolder {
  constructor(state, paramType) {
    this.paramType = paramType;
    this.name = Object.keys(state)[0];
    this.value = state[this.name];
  }
}

/**
 *
 * @param {QueryableParamHolder[]} queryableParamHolders
 */
export function stateToQueryString(queryableParamHolders) {
  const queryParams = Object.assign(
    ...queryableParamHolders.map((qph) => ({ [qph.name]: qph.paramType }))
  );
  const queryValues = Object.assign(
    ...queryableParamHolders.map((qph) => ({ [qph.name]: qph.value }))
  );
  return stringify(encodeQueryParams(queryParams, queryValues));
}

export function buildUrlForCurrentPage(queryString) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?${queryString}`;
}

export function queryStringToDefaults(query, queryParams, defaults) {
  // console.log(query, queryParams);
  const strings = parse(query);

  let state = {};
  Object.keys(strings).forEach((k) => {
    Object.assign(defaults, { [k]: queryParams[k].decode(strings[k]) });
  });

  return defaults;
}

export { NumberParam } from "use-query-params";
