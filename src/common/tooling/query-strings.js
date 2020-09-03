import { compressorMap } from "common/models/compressors";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import Qty from "js-quantities";
import { parse, stringify } from "query-string";
import {
  decodeArray,
  decodeBoolean,
  decodeObject,
  encodeArray,
  encodeBoolean,
  encodeObject,
  encodeQueryParams,
} from "use-query-params";

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
    return encodeArray(
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
  },
  decode: (str) => {
    const obj = decodeArray(str);
    return Object.assign(
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

export function queryStringToDefaults(
  query,
  queryParams,
  defaults,
  conversionFn
) {
  const strings = parse(query);

  if (conversionFn === undefined) {
    Object.keys(strings).forEach((k) => {
      if (k !== "version") {
        Object.assign(defaults, { [k]: queryParams[k].decode(strings[k]) });
      }
    });
  } else {
    Object.assign(defaults, conversionFn(strings, queryParams));
  }

  return defaults;
}

export const MotorParam = Motor.getParam();
export const RatioParam = Ratio.getParam();
export { NumberParam } from "use-query-params";
