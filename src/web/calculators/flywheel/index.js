import Motor from "common/models/Motor";
import Qty from "common/models/Qty";
import Ratio from "common/models/Ratio";
import { lazy } from "react";

export default {
  url: "/flywheel",
  image: "/media/Flywheel",
  title: "Flywheel Calculator",
  version: 1,
  initialState: {
    motor: new Motor(1, "Falcon 500"),
    ratio: new Ratio(1, Ratio.REDUCTION),
    radius: new Qty(2, "in"),
    targetSpeed: new Qty(2000, "rpm"),
    weight: new Qty(5, "lb"),
  },
  component: lazy(() => import("web/calculators/flywheel/Flywheel")),
};
