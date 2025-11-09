import PageConfig from "common/models/PageConfig";
import { lazy } from "react";

const aboutConfig: PageConfig = {
  url: "/about",
  title: "About ReCalc",
  description: "About ReCalc",
  version: 1,
  component: lazy(() => import("web/about/About")),
};

export default aboutConfig;
