import { parse, stringify } from "query-string";
import { encodeQueryParams } from "use-query-params";

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
 * @return {string}
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

/**
 *
 * @param {string} queryString
 * @returns {string}
 */
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
      if (k !== "version" && k in queryParams) {
        Object.assign(defaults, { [k]: queryParams[k].decode(strings[k]) });
      }
    });
  } else {
    Object.assign(defaults, conversionFn(strings, queryParams));
  }

  return defaults;
}
