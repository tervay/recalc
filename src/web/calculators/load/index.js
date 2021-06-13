import Material from "common/models/Material";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig.js";
import Ratio from "common/models/Ratio";
import { lazy } from "react";

export default new PageConfig({
  url: "/gearload",
  title: "Gear Load Calculator",
  description: "Gear shock & sustain load calculator",
  image: "/media/Gears",
  version: 1,
  initialState: {
    motor: Motor.Falcon500s(2),
    planetaryRatio: new Ratio(1, Ratio.REDUCTION),
    currentLimit: new Measurement(60, "A"),
    diametralPitch: new Measurement(20, "1/in"),
    pressureAngle: "14.5°",
    pinionTeeth: 10,
    gearTeeth: 60,
    pinionWidth: new Measurement(0.475, "in"),
    gearWidth: new Measurement(0.375, "in"),
    pinionMaterial: Material.Steel4140(),
    gearMaterial: Material.Aluminum7075_T6(),
  },
  component: lazy(() => import("web/calculators/load/Load")),
});
