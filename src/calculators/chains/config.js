import Qty from "js-quantities";

export const URL = "/chains";
// export const IMAGE = "/media/Belts.png";
export const TITLE = "Chain Calculator";
export const VERSION = 1;

export const initialState = {
  chain: "#25",
  p1Teeth: 36,
  p2Teeth: 16,
  desiredCenter: Qty(5, "in"),
  extraCenter: Qty(0, "in"),
};

export { default as Component } from "./Chains";
