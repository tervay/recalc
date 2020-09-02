import Qty from "js-quantities";
import keyBy from "lodash/keyBy";
import { decodeObject, encodeObject } from "use-query-params";

export class Motor {
  constructor(quantity, name, data) {
    this.quantity = quantity;
    this.name = name;

    data = data || motorMap[name];
    this.freeSpeed = data.freeSpeed;
    this.stallTorque = data.stallTorque;
    this.stallCurrent = data.stallCurrent;
    this.freeCurrent = data.freeCurrent;
    this.power = this.freeSpeed
      .div(2)
      .mul((2 * Math.PI) / 60)
      .mul(this.stallTorque)
      .div(2);
    this.resistance = Qty(12, "V").div(this.stallCurrent);
  }

  static get choices() {
    return Object.keys(motorMap);
  }

  toDict() {
    return {
      quantity: this.quantity,
      name: this.name,
    };
  }

  static fromDict(dict) {
    return new Motor(dict.quantity, dict.name);
  }

  static encode(motor) {
    return encodeObject(motor.toDict());
  }

  static decode(string) {
    return Motor.fromDict(decodeObject(string));
  }

  static getParam() {
    return {
      encode: Motor.encode,
      decode: Motor.decode,
    };
  }
}

const motorMap = keyBy(
  [
    {
      name: "Falcon 500",
      freeSpeed: Qty(6380, "rpm"),
      stallTorque: Qty(4.69, "N*m"),
      stallCurrent: Qty(257, "A"),
      freeCurrent: Qty(1.5, "A"),
    },
    {
      name: "NEO",
      freeSpeed: Qty(5676, "rpm"),
      stallTorque: Qty(2.6, "N*m"),
      stallCurrent: Qty(105, "A"),
      freeCurrent: Qty(1.8, "A"),
    },
    {
      name: "775pro",
      freeSpeed: Qty(18730, "rpm"),
      stallTorque: Qty(0.71, "N*m"),
      stallCurrent: Qty(134, "A"),
      freeCurrent: Qty(0.7, "A"),
    },
    {
      name: "NEO 550",
      freeSpeed: Qty(11000, "rpm"),
      stallTorque: Qty(0.97, "N*m"),
      stallCurrent: Qty(100, "A"),
      freeCurrent: Qty(1.4, "A"),
    },
    {
      name: "CIM",
      freeSpeed: Qty(5330, "rpm"),
      stallTorque: Qty(2.41, "N*m"),
      stallCurrent: Qty(131, "A"),
      freeCurrent: Qty(2.7, "A"),
    },
    {
      name: "MiniCIM",
      freeSpeed: Qty(5840, "rpm"),
      stallTorque: Qty(1.41, "N*m"),
      stallCurrent: Qty(89, "A"),
      freeCurrent: Qty(3, "A"),
    },
    {
      name: "BAG",
      freeSpeed: Qty(13180, "rpm"),
      stallTorque: Qty(0.43, "N*m"),
      stallCurrent: Qty(53, "A"),
      freeCurrent: Qty(1.8, "A"),
    },
  ],
  "name"
);
