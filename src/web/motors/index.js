import PageConfig from "common/models/PageConfig.js";
import { lazy } from "react";

export default new PageConfig({
  url: "/motors",
  image: "/media/Motor",
  title: "Motor Info",
  description: "Legal motor information",
  initialState: {},
  version: 0,
  component: lazy(() => import("web/motors/Motors")),
});
