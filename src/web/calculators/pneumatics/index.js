import Compressor from "common/models/Compressor";
import Measurement from "common/models/Measurement";
import PageConfig from "common/models/PageConfig.js";
import Piston from "common/models/Piston";
import { lazy } from "react";

export default new PageConfig({
  url: "/pneumatics",
  title: "Pneumatics Calculator",
  description: "Pneumatic system calculator",
  version: 1,
  image: "media/Pneumatics",
  initialState: {
    p1: new Piston({
      enabled: true,
      bore: new Measurement(1.5, "in"),
      rodDiameter: new Measurement(0.375, "in"),
      strokeLength: new Measurement(12, "in"),
      pushPressure: new Measurement(40, "psi"),
      pullPressure: new Measurement(15, "psi"),
      period: new Measurement(10, "s"),
    }),
    p2: new Piston({
      enabled: false,
      bore: new Measurement(1.5, "in"),
      rodDiameter: new Measurement(0.375, "in"),
      strokeLength: new Measurement(12, "in"),
      pushPressure: new Measurement(40, "psi"),
      pullPressure: new Measurement(15, "psi"),
      period: new Measurement(8, "s"),
    }),
    p3: new Piston({
      enabled: false,
      bore: new Measurement(1.5, "in"),
      rodDiameter: new Measurement(0.375, "in"),
      strokeLength: new Measurement(12, "in"),
      pushPressure: new Measurement(40, "psi"),
      pullPressure: new Measurement(15, "psi"),
      period: new Measurement(5, "s"),
    }),
    volume: new Measurement(1200, "ml"),
    compressor: new Compressor("VIAIR 90C (12v)"),
  },
  component: lazy(() => import("web/calculators/pneumatics/Pneumatics")),
});
