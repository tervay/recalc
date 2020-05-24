import Qty from "js-quantities";
import { isEqual } from "lodash";
import { useRef } from "react";
import { decodeObject, encodeObject } from "use-query-params";
import { motorMap } from "./motors";

export function QtyToDict(qty, unit = null) {
  return unit === null
    ? {
        magnitude: qty.scalar,
        unit: qty.units(),
      }
    : {
        magnitude: qty.to(unit).scalar,
        unit: unit,
      };
}

export function DictToQty(d) {
  return Qty(d.magnitude, d.unit);
}

export const QtyParam = {
  encode: (value) => {
    return encodeObject(QtyToDict(value));
  },
  decode: (stringValue) => {
    if (stringValue === undefined) return stringValue;
    const obj = decodeObject(stringValue);
    return Qty(Number(obj.magnitude), obj.unit);
  },
};

export const useDeepCompare = (value) => {
  const ref = useRef();
  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
};

export function MotorDictToObj(name, quantity) {
  return {
    motor: motorMap[name],
    quantity: quantity,
  };
}

export const MotorParam = {
  encode: (value) => {
    return encodeObject({
      name: value.motor.name,
      quantity: value.quantity,
    });
  },
  decode: (stringValue) => {
    if (stringValue === undefined) return stringValue;
    const obj = decodeObject(stringValue);
    return MotorDictToObj(obj.name, obj.quantity);
  },
};
