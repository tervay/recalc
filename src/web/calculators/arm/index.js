import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import { lazy } from "react";

export default {
  url: "/arm",
  // image: "/media/Belts",
  title: "Arm Calculator",
  version: 1,
  initialState: {
    motor: new Motor(2, "Falcon 500"),
    ratio: new Ratio(60, Ratio.REDUCTION),
    armLength: new Measurement(10, "in"),
    armLoad: new Measurement(5, "lbf"),
    angleChange: new Measurement(90, "deg"),
  },
  component: lazy(() => import("web/calculators/arm/Arm")),
};
