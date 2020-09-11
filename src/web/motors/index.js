import { lazy } from "react";

export default {
  url: "/motors",
  // image: "/media/Belts",
  title: "Motor Info",
  component: lazy(() => import("web/motors/Motors")),
};
