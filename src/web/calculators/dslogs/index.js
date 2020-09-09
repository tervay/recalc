import { lazy } from "react";

export default {
  url: "/dslogs",
  title: "DS Log Viewer",
  version: 1,
  initialState: {},
  component: lazy(() => import("web/calculators/dslogs/DSLogs")),
};
