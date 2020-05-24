import { createSlice } from "@reduxjs/toolkit";
import Qty from "js-quantities";
import { CalculateWindupTime } from "./math";

export const flywheelSlice = createSlice({
  name: "flywheel",
  initialState: {
    windupTime: Qty(0, "s"),
  },
  reducers: {
    calculateWindupTimeReducer: CalculateWindupTime,
  },
});

export const { calculateWindupTimeReducer } = flywheelSlice.actions;

export default flywheelSlice.reducer;
