import { lazy } from "react";

export default {
  url: "/articles/:id",
  component: lazy(() => import("./Articles")),
};
