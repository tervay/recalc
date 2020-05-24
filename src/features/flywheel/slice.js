import { createSlice } from "@reduxjs/toolkit";
import Qty from "js-quantities";
import { CalculateWindupTime } from "./math";
import { DictToQty } from "../common/params";
import makeLineOptions from "../common/charts";
import _ from "lodash";

export const flywheelSlice = createSlice({
  name: "flywheel",
  initialState: {
    windupTime: Qty(0, "s"),
    windupTimeChart: {
      options: {},
      data: [],
    },
  },
  reducers: {
    calculateWindupTimeReducer: (state, action) => {
      state.windupTime = CalculateWindupTime(state, action);
    },
    generateWindupTimeChartReducer: (state, action) => {
      const ratio = action.payload.ratio;
      const start = 0.25 * ratio;
      const end = 4.0 * ratio;
      const n = 125;
      const step = (end - start) / n;

      let firstZero = null;
      const data = [];

      const getTime = (ratio) => {
        const time = CalculateWindupTime(state, {
          ...action,
          payload: {
            ...action.payload,
            ratio: ratio,
          },
        });

        return time;
      };

      for (let i = start; i < end; i += step) {
        const time = getTime(i);
        if (time.scalar !== 0) {
          data.push({
            x: i,
            y: time.scalar,
          });
        } else {
          if (firstZero === null) {
            firstZero = i;
          }
        }
      }

      if (firstZero !== null) {
        const extraPts = n - data.length;
        const newStep = (firstZero - start) / extraPts;
        for (let i = start + newStep; i < firstZero; i += newStep) {
          const time = getTime(i);
          if (time.scalar !== 0) {
            data.push({
              x: i,
              y: time.scalar,
            });
          } else {
            if (firstZero === null) {
              firstZero = i;
            }
          }
        }
      }

      state.windupTimeChart.data = _.orderBy(data, ["x"]);
      state.windupTimeChart.options = makeLineOptions(
        "Ratio vs Windup Time",
        "Ratio",
        "Windup Time"
      );
    },
  },
});

export const {
  calculateWindupTimeReducer,
  generateWindupTimeChartReducer,
} = flywheelSlice.actions;

export default flywheelSlice.reducer;
