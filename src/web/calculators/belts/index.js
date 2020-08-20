import Qty from "js-quantities";
import { lazy } from "react";

export default {
  url: "/belts",
  image: "/media/Belts",
  title: "Belt Calculator",
  version: 1,
  initialState: {
    pitch: Qty(3, "mm"),
    p1Teeth: 24,
    p2Teeth: 16,
    desiredCenter: Qty(5, "in"),
    extraCenter: Qty(0, "in"),
  },
  component: lazy(() => import("web/calculators/belts/Belts")),
};
