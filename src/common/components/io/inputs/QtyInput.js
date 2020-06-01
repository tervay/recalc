import Qty from "js-quantities";
import React, { useEffect, useState } from "react";
import { cleanNumberInput } from "../../../tooling/io";
import { UnlabeledTypedNumberInput } from "./TypedNumberInput";

export function UnlabeledQtyInput(props) {
  const [qty, setQty] = props.stateHook;
  const [magnitude, setMagnitude] = useState(qty.scalar);
  const [unit, setUnit] = useState(qty.units());

  useEffect(() => {
    setQty(Qty(cleanNumberInput(magnitude), unit));
  }, [magnitude, unit]);

  return (
    <UnlabeledTypedNumberInput
      magnitudeStateHook={[magnitude, setMagnitude]}
      selectStateHook={[unit, setUnit]}
      choices={props.choices}
    />
  );
}

export function LabeledQtyInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <UnlabeledQtyInput {...props} />
      </div>
    </div>
  );
}
