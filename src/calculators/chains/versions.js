import { defaultAssignment } from "common/tooling/versions";

import { VERSION } from "./config";

export function chainVersionManager(query, queryParams) {
  if (query.version === undefined || Number(query.version) === VERSION) {
    return defaultAssignment(query, queryParams);
  }
}
