import { defaultAssignment } from "common/tooling/versions";

import chains from "./index";

export function chainVersionManager(query, queryParams) {
  if (query.version === undefined || Number(query.version) === chains.version) {
    return defaultAssignment(query, queryParams);
  }
}
