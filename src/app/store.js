import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/slice";
import counterReducer from "../features/belt_calculator/slice";
import { QtyTranscoderMiddleware } from "../features/common/middleware";
import flywheelReducer from "../features/flywheel/slice";

export default configureStore({
  reducer: {
    beltCalculator: counterReducer,
    auth: authReducer,
    flywheel: flywheelReducer,
  },
  middleware: [QtyTranscoderMiddleware],
});
