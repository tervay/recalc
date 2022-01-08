import PageConfig from "common/models/PageConfig";
import { lazy } from "react";

const utilConfig: PageConfig = {
  url: "/util",
  title: "Utility Reference",
  description: "",
  component: lazy(() => import("./components/Util")),
};

export default utilConfig;
