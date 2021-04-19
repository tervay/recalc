import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig.js";
import Ratio from "common/models/Ratio";
import { lazy } from "react";

export default new PageConfig({
  url: "/flywheel",
  image: "/media/Flywheel",
  title: "Flywheel Calculator",
  description: "Flywheel windup calculator",
  version: 1,
  initialState: {
    motor: Motor.Falcon500s(1),
    ratio: new Ratio(1, Ratio.REDUCTION),
    radius: new Measurement(2, "in"),
    targetSpeed: new Measurement(2000, "rpm"),
    weight: new Measurement(5, "lb"),
    momentOfInertia: new Measurement(10, "lb in^2"),
    useCustomMOI: false,
  },
  component: lazy(() => import("web/calculators/flywheel/Flywheel")),
});
