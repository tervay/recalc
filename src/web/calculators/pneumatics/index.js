import Compressor from "common/models/Compressor";
import Qty from "js-quantities";
import { lazy } from "react";

export default {
  url: "/pneumatics",
  title: "Pneumatics Calculator",
  version: 1,
  image: "media/Pneumatics",
  initialState: {
    p1: {
      enabled: true,
      diameter: Qty(1.5, "in"),
      rodDiameter: Qty(0.375, "in"),
      strokeLength: Qty(12, "in"),
      pushPressure: Qty(40, "psi"),
      pullPressure: Qty(15, "psi"),
      period: Qty(10, "s"),
    },
    p2: {
      enabled: false,
      diameter: Qty(1.5, "in"),
      rodDiameter: Qty(0.375, "in"),
      strokeLength: Qty(12, "in"),
      pushPressure: Qty(40, "psi"),
      pullPressure: Qty(15, "psi"),
      period: Qty(8, "s"),
    },
    p3: {
      enabled: false,
      diameter: Qty(1.5, "in"),
      rodDiameter: Qty(0.375, "in"),
      strokeLength: Qty(12, "in"),
      pushPressure: Qty(40, "psi"),
      pullPressure: Qty(15, "psi"),
      period: Qty(5, "s"),
    },
    volume: Qty(1200, "ml"),
    compressor: new Compressor("VIAIR 90C (12v)"),
  },
  component: lazy(() => import("web/calculators/pneumatics/Pneumatics")),
};
