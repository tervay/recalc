import Qty from "js-quantities";
import { lazy } from "react";

import { Motor } from "../../../common/tooling/motors";
import { RATIO_REDUCTION } from "../../../common/tooling/query-strings";

export default {
  url: "/linear",
  title: "Linear Mechanism Calculator",
  version: 1,
  initialState: {
    motor: new Motor(1, "Falcon 500"),
    travelDistance: Qty(40, "in"),
    spoolDiameter: Qty(1, "in"),
    load: Qty(120, "lb"),
    ratio: {
      amount: 2,
      type: RATIO_REDUCTION,
    },
    efficiency: 100,
  },
  component: lazy(() => import("web/calculators/linear_mech/LinearMech")),
};
