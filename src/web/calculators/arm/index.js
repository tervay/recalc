import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import { CIRCLE_RIGHT, CIRCLE_UP } from "common/tooling/math";
import { lazy } from "react";

export default {
  url: "/arm",
  // image: "/media/Belts",
  title: "Arm Calculator",
  version: 1,
  initialState: {
    motor: new Motor(2, "Falcon 500"),
    ratio: new Ratio(100, Ratio.REDUCTION),
    comLength: new Measurement(20, "in"),
    armMass: new Measurement(15, "lb"),
    startAngle: CIRCLE_RIGHT.to("deg"),
    endAngle: CIRCLE_UP.to("deg"),
    iterationLimit: 10000,
  },
  component: lazy(() => import("web/calculators/arm/Arm")),
};
