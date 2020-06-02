import Qty from "js-quantities";
import { stringify } from "query-string";
import {
  decodeObject,
  encodeObject,
  encodeQueryParams,
} from "use-query-params";
import { motorMap } from "./motors";

function QtyToDict(qty) {
  return {
    s: qty.scalar,
    u: qty.units(),
  };
}

function DictToQty(dict) {
  return Qty(dict.s, dict.u);
}

function MotorToDict(motor) {
  return {
    name: motor.data.name,
    quantity: motor.quantity,
  };
}

function DictToMotor(dict) {
  return {
    quantity: dict.quantity,
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

export { NumberParam } from "use-query-params";
