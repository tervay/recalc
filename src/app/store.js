import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "../features/belt_calculator/slice";
import { QtyTranscoderMiddleware } from "../utils";

export default configureStore({
  reducer: {
    beltCalculator: counterReducer,
  },
  middleware: [QtyTranscoderMiddleware],
});
