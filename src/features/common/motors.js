import Qty from "js-quantities";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { MotorDictToObj } from "./params";

export const motorMap = _.keyBy(
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
  ].map((m) => ({
    ...m,
    power: m.freeSpeed
      .div(2)
      .mul((2 * Math.PI) / 60)
      .mul(m.stallTorque)
      .div(2),
    resistance: Qty(12, "V").div(m.stallCurrent),
  })),
  "name"
);

export default function MotorSelect(props) {
  // Prepare inputs
  const [motorName, setMotorName] = useState(props.motor.motor.name);
  const [quantity, setQuantity] = useState(props.motor.quantity);

  // Update
  useEffect(() => {
    let val = NaN;
    switch (quantity) {
      case ".":
        val = 0;
        break;
      case "-":
        val = 0;
        break;
      default:
        val = Number(quantity);
        break;
    }

    if (val !== NaN && motorName !== undefined) {
      props.setQuery({
        [props.name]: MotorDictToObj(motorName, val),
      });
    }
  }, [motorName, quantity]);

  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">Motors</label>
      </div>
      <div className="field-body">
        <div className="field has-addons">
          <p className="control is-expanded">
            <input
              type="number"
              className="input input-right"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
              }}
            />
          </p>
          <p className="control">
            <span className="select">
              <select
                defaultValue={motorName}
                onChange={(e) => {
                  setMotorName(e.target.value);
                }}
              >
                {Object.keys(motorMap).map((c) => {
                  return <option key={c}>{c}</option>;
                })}
              </select>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
