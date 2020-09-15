import Qty from "js-quantities";
import { lazy } from "react";

import Motor from "../../../common/models/Motor";
import Ratio from "../../../common/models/Ratio";
export default {
  url: "/flywheel",
  image: "/media/Flywheel",
  title: "Flywheel Calculator",
  version: 1,
  initialState: {
    motor: new Motor(1, "Falcon 500"),
    ratio: new Ratio(1, Ratio.REDUCTION),
    radius: Qty(2, "in"),
    targetSpeed: Qty(2000, "rpm"),
    weight: Qty(5, "lb"),
  },
  component: lazy(() => import("web/calculators/flywheel/Flywheel")),
};
