import Qty from "js-quantities";
import { parse, stringify } from "query-string";
import {
  decodeArray,
  decodeObject,
  encodeArray,
  encodeObject,
  encodeQueryParams,
  encodeBoolean,
  decodeBoolean,
} from "use-query-params";
import { motorMap } from "./motors";
import { compressorMap } from "./compressors";

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

export const MotorParam = {
  encode: (motor) => encodeObject(MotorToDict(motor)),
  decode: (str) => DictToMotor(decodeObject(str)),
};

function CompressorToDict(compressor) {
  return {
    name: compressor.name,
  };
}

function DictToCompressor(dict) {
  return compressorMap[dict.name];
}

export const CompressorParam = {
  encode: (compressor) => {
    return encodeObject(CompressorToDict(compressor));
  },
  decode: (str) => {
    return DictToCompressor(decodeObject(str));
  },
};

function QtyToDict(qty) {
  return {
    s: qty.scalar,
    u: qty.units(),
  };
}

function DictToQty(dict) {
  return Qty(Number(dict.s), dict.u);
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
        if (piston[k] instanceof Object) {
          return encodeObject({
            name: k,
            value: QtyParam.encode(piston[k]).replace("_", "|"),
          });
        } else {
          return encodeObject({
            name: "enabled",
            value: encodeBoolean(piston[k]),
          });
        }
      })
    );
    return a;
  },
  decode: (str) => {
    const obj = decodeArray(str);
    const s = Object.assign(
      ...obj.map((s) => {
        const d = decodeObject(s);
        if (d.name === "enabled") {
          return { [d.name]: decodeBoolean(d.value) };
        }
        return {
          [d.name]: QtyParam.decode(d.value.replace("|", "_")),
        };
      })
    );
    return s;
  },
};

function RatioToDict(ratio) {
  return ratio;
}

function DictToRatio(ratio) {
  return ratio;
}

export const RATIO_REDUCTION = "reduction";
export const RATIO_STEPUP = "step-up";

export const RatioParam = {
  encode: (ratio) => {
    return encodeObject(ratio);
  },
  decode: (str) => {
    return decodeObject(str);
  },
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
