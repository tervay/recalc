import Qty from "js-quantities";

export const URL = "/belts";
export const IMAGE = "/media/Belts.png";
export const TITLE = "Belt Calculator";
export const VERSION = 1;

export const initialState = {
  pitch: Qty(3, "mm"),
  p1Teeth: 24,
  p2Teeth: 16,
  desiredCenter: Qty(5, "in"),
  extraCenter: Qty(0, "in"),
};

export { default as Component } from "calculators/belts/Belts";
