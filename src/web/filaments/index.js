import { lazy } from "react";

export default {
  url: "/filaments",
  // image: "/media/Belts",
  title: "Filament Info",
  component: lazy(() => import("web/filaments/Filaments")),
};
