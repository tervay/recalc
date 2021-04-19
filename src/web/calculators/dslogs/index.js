import PageConfig from "common/models/PageConfig.js";
import { lazy } from "react";

export default new PageConfig({
  url: "/dslogs",
  title: "DS Log Viewer",
  version: 1,
  initialState: {},
  component: lazy(() => import("web/calculators/dslogs/DSLogs")),
});
