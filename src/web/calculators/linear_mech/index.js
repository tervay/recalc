import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig.js";
import Ratio from "common/models/Ratio";
import { lazy } from "react";

export default new PageConfig({
  url: "/linear",
  title: "Linear Mechanism Calculator",
  description: "Linear mechanism / continuous elevator calculator",
  image: "/media/Elevator",
  version: 1,
  initialState: {
    motor: Motor.Falcon500s(1),
    travelDistance: new Measurement(40, "in"),
    spoolDiameter: new Measurement(1, "in"),
    load: new Measurement(120, "lb"),
    ratio: new Ratio(2, Ratio.REDUCTION),
    efficiency: 100,
  },
  component: lazy(() => import("web/calculators/linear_mech/LinearMech")),
});
