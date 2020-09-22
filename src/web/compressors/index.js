import { lazy } from "react";

export default {
  url: "/compressors",
  image: "/media/Compressor",
  title: "Compressor Info",
  component: lazy(() => import("web/compressors/Compressors")),
};
