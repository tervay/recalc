import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
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
    radius: new Measurement(2, "in"),
    targetSpeed: new Measurement(2000, "rpm"),
    weight: new Measurement(5, "lb"),
  },
  component: lazy(() => import("web/calculators/flywheel/Flywheel")),
};
