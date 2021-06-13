import PageConfig from "common/models/PageConfig.js";
import { lazy } from "react";

export default new PageConfig({
  url: "/materials",
  image: "/media/Filament",
  title: "Material Info",
  description: "Common material information",
  initialState: {},
  version: 0,
  component: lazy(() => import("web/materials/Materials")),
});
