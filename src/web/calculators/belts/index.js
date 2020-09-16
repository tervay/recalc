import Qty from "common/models/Qty";
import { lazy } from "react";

export default {
  url: "/belts",
  image: "/media/Belts",
  title: "Belt Calculator",
  version: 1,
  initialState: {
    pitch: new Qty(3, "mm"),
    p1Teeth: 24,
    p2Teeth: 16,
    desiredCenter: new Qty(5, "in"),
    extraCenter: new Qty(0, "in"),
  },
  component: lazy(() => import("web/calculators/belts/Belts")),
};
