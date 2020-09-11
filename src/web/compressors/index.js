import { lazy } from "react";

export default {
  url: "/compressors",
  // image: "/media/Belts",
  title: "Compressor Info",
  component: lazy(() => import("web/compressors/Compressors")),
};
