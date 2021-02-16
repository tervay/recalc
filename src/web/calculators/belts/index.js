import Measurement from "common/models/Measurement";
import { lazy } from "react";

export default {
  url: "/belts",
  image: "/media/Belts",
  title: "Belt Calculator",
  version: 1,
  initialState: {
    pitch: new Measurement(3, "mm").to("mm"),
    p1Teeth: 24,
    p2Teeth: 16,
    desiredCenter: new Measurement(5, "in"),
    extraCenter: new Measurement(0, "in"),
    toothIncrement: 5,
    toothMax: 250,
    useCustomBelt: false,
    customBeltTeeth: 125,
  },
  component: lazy(() => import("web/calculators/belts/Belts")),
};
