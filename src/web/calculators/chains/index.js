import Qty from "common/models/Qty";
import { lazy } from "react";

export default {
  url: "/chains",
  title: "Chain Calculator",
  version: 1,
  initialState: {
    chain: "#25",
    p1Teeth: 36,
    p2Teeth: 16,
    desiredCenter: new Qty(5, "in"),
    extraCenter: new Qty(0, "in"),
  },
  component: lazy(() => import("web/calculators/chains/Chains")),
};
