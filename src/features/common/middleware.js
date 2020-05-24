import Qty from "js-quantities";
import { DictToQty, QtyToDict } from "./params";

export const QtyTranscoderMiddleware = (store) => (next) => (action) => {
  if (!action.payload) return next(action);

  const newAction = {
    ...action,
    payload: Object.fromEntries(
      Object.entries(action.payload).map(([k, v]) => {
        return [k, v instanceof Qty ? QtyToDict(v) : v];
      })
    ),
  };

  let result = next(newAction);
  const newResult = {
    ...result,
    payload: Object.fromEntries(
      Object.entries(result).map(([k, v]) => {
        if (v.hasOwnProperty("unit") && v.hasOwnProperty("magnitude")) {
          return [k, DictToQty(v)];
        } else {
          return [k, v];
        }
      })
    ),
  };

  return newResult;
};
