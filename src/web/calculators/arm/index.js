import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig.js";
import Ratio from "common/models/Ratio";
import { CIRCLE_RIGHT, CIRCLE_UP } from "common/tooling/math";
import { lazy } from "react";

export default new PageConfig({
  url: "/arm",
  // image: "/media/Belts",
  title: "Arm Calculator",
  description: "Mechanical arm design calculator",
  version: 1,
  initialState: {
    motor: Motor.Falcon500s(2),
    ratio: new Ratio(100, Ratio.REDUCTION),
    comLength: new Measurement(20, "in"),
    armMass: new Measurement(15, "lb"),
    currentLimit: new Measurement(40, "A"),
    startAngle: CIRCLE_RIGHT.to("deg"),
    endAngle: CIRCLE_UP.to("deg"),
    iterationLimit: 10000,
  },
  component: lazy(() => import("web/calculators/arm/Arm")),
});
