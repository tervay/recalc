import { lazy } from "react";

export default {
  url: "/motors",
  image: "/media/Motor",
  title: "Motor Info",
  component: lazy(() => import("web/motors/Motors")),
};
