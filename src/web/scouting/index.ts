import PageConfig from "common/models/PageConfig";
import { lazy } from "react";

const utilConfig: PageConfig = {
  url: "/scouting",
  title: "Scouting Helpers",
  description: "",
  component: lazy(() => import("./CsvGenerators")),
};

export default utilConfig;
