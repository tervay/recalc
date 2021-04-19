import PageConfig from "common/models/PageConfig.js";
import { lazy } from "react";

export default new PageConfig({
  url: "/compressors",
  image: "/media/Compressor",
  description: "Legal compressor information",
  initialState: {},
  version: 0,
  title: "Compressor Info",
  component: lazy(() => import("web/compressors/Compressors")),
});
