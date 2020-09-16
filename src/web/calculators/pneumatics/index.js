import Compressor from "common/models/Compressor";
import Piston from "common/models/Piston";
import Qty from "common/models/Qty";
import { lazy } from "react";

export default {
  url: "/pneumatics",
  title: "Pneumatics Calculator",
  version: 1,
  image: "media/Pneumatics",
  initialState: {
    p1: new Piston({
      enabled: true,
      bore: new Qty(1.5, "in"),
      rodDiameter: new Qty(0.375, "in"),
      strokeLength: new Qty(12, "in"),
      pushPressure: new Qty(40, "psi"),
      pullPressure: new Qty(15, "psi"),
      period: new Qty(10, "s"),
    }),
    p2: new Piston({
      enabled: false,
      bore: new Qty(1.5, "in"),
      rodDiameter: new Qty(0.375, "in"),
      strokeLength: new Qty(12, "in"),
      pushPressure: new Qty(40, "psi"),
      pullPressure: new Qty(15, "psi"),
      period: new Qty(8, "s"),
    }),
    p3: new Piston({
      enabled: false,
      bore: new Qty(1.5, "in"),
      rodDiameter: new Qty(0.375, "in"),
      strokeLength: new Qty(12, "in"),
      pushPressure: new Qty(40, "psi"),
      pullPressure: new Qty(15, "psi"),
      period: new Qty(5, "s"),
    }),
    volume: new Qty(1200, "ml"),
    compressor: new Compressor("VIAIR 90C (12v)"),
  },
  component: lazy(() => import("web/calculators/pneumatics/Pneumatics")),
};
