import PageConfig from "common/models/PageConfig";
import { lazy } from "react";

const utilConfig: PageConfig = {
  url: "/util",
  title: "Cheat Sheets",
  description: "",
  component: lazy(() => import("./components/Util")),
};

export default utilConfig;
