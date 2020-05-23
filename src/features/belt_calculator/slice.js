import { createSlice } from "@reduxjs/toolkit";
import { calculateClosestSizes } from "./math";
import Qty from "js-quantities";

export const beltCalculatorSlice = createSlice({
  name: "beltCalculator",
  initialState: {
    closestSmaller: {
      teeth: 0,
      distance: Qty(0, "in"),
    },
    closestLarger: {
      teeth: 0,
      distance: Qty(0, "in"),
    },
  },
  reducers: {
    calculateClosestSizesReducer: calculateClosestSizes,
  },
});

export const { calculateClosestSizesReducer } = beltCalculatorSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`

export default beltCalculatorSlice.reducer;
