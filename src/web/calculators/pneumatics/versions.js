import { defaultAssignment } from "common/tooling/versions";

import pneumatics from "./index";

export function pneumaticsVersionManager(query, queryParams) {
  if (
    query.version === undefined ||
    Number(query.version) === pneumatics.version
  ) {
    return defaultAssignment(query, queryParams);
  }
}
