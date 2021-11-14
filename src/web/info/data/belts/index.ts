import PageConfig from "common/models/PageConfig";
import { lazy } from "react";

const beltDataConfig: PageConfig = {
  url: "belts",
  title: "Belt Data",
  description: "All belt data",
  component: lazy(() => import("web/info/data/belts/BeltDataDisplay")),
};

export default beltDataConfig;
