import { VERSION } from "./config";

export function beltVersionManager(query, queryParams) {
  const r = {};
  if (query.version === undefined || Number(query.version) === VERSION) {
    Object.keys(query).forEach((k) => {
      if (k !== "version") {
        Object.assign(r, {
          [k]: queryParams[k].decode(query[k]),
        });
      }
    });
  }

  return r;
}
