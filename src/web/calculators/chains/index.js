import Measurement from "common/models/Measurement";
import { lazy } from "react";

export default {
  url: "/chains",
  image: "/media/Chain",
  title: "Chain Calculator",
  version: 1,
  initialState: {
    chain: "#25",
    p1Teeth: 36,
    p2Teeth: 16,
    desiredCenter: new Measurement(5, "in"),
    extraCenter: new Measurement(0, "in"),
  },
  component: lazy(() => import("web/calculators/chains/Chains")),
};
