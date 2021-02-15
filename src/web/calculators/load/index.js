import Material from "common/models/Material";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import { lazy } from "react";

export default {
  url: "/gearload",
  title: "Gear Load Calculator",
  version: 1,
  initialState: {
    motor: Motor.Falcon500s(2),
    currentLimit: new Measurement(60, "A"),
    diametralPitch: new Measurement(20, "1/in"),
    pressureAngle: "14.5°",
    pinionTeeth: 10,
    gearTeeth: 60,
    pinionWidth: new Measurement(0.475, "in"),
    gearWidth: new Measurement(0.375, "in"),
    pinionMaterial: Material.Steel4140Annealed(),
    gearMaterial: Material.Aluminum7075_T6(),
  },
  component: lazy(() => import("web/calculators/load/Load")),
};
