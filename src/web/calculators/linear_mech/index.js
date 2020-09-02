import Motor from "common/tooling/Motor";
import Ratio from "common/tooling/Ratio";
import Qty from "js-quantities";
import { lazy } from "react";

export default {
  url: "/linear",
  title: "Linear Mechanism Calculator",
  version: 1,
  initialState: {
    motor: new Motor(1, "Falcon 500"),
    travelDistance: Qty(40, "in"),
    spoolDiameter: Qty(1, "in"),
    load: Qty(120, "lb"),
    ratio: new Ratio(2, Ratio.REDUCTION),
    efficiency: 100,
  },
  component: lazy(() => import("web/calculators/linear_mech/LinearMech")),
};
