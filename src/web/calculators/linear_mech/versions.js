import { defaultAssignment } from "common/tooling/versions";

import linear from "./index";

export function linearVersionManager(query, queryParams) {
  if (query.version === undefined || Number(query.version) === linear.version) {
    return defaultAssignment(query, queryParams);
  }
}
