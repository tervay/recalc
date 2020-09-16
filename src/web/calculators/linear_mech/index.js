import Motor from "common/models/Motor";
import Qty from "common/models/Qty";
import Ratio from "common/models/Ratio";
import { lazy } from "react";

export default {
  url: "/linear",
  title: "Linear Mechanism Calculator",
  version: 1,
  initialState: {
    motor: new Motor(1, "Falcon 500"),
    travelDistance: new Qty(40, "in"),
    spoolDiameter: new Qty(1, "in"),
    load: new Qty(120, "lb"),
    ratio: new Ratio(2, Ratio.REDUCTION),
    efficiency: 100,
  },
  component: lazy(() => import("web/calculators/linear_mech/LinearMech")),
};
