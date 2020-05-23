import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "../features/belt_calculator/slice";
import { QtyTranscoderMiddleware } from "../utils";
import authReducer from "../features/auth/slice";

export default configureStore({
  reducer: {
    beltCalculator: counterReducer,
    auth: authReducer,
  },
  middleware: [QtyTranscoderMiddleware],
});
