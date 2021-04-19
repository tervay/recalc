import PageConfig from "common/models/PageConfig.js";
import { lazy } from "react";

export default new PageConfig({
  url: "/filaments",
  image: "/media/Filament",
  title: "Filament Info",
  description: "Common filament information",
  initialState: {},
  version: 0,
  component: lazy(() => import("web/filaments/Filaments")),
});
