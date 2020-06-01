import React, { useEffect, useState } from "react";
import { cleanNumberInput } from "../../../tooling/io";
import { UnlabeledTypedNumberInput } from "./TypedNumberInput";
import { motorMap } from "../../../tooling/motors";

export function UnlabeledMotorInput(props) {
  const [motor, setMotor] = props.stateHook;
  const [magnitude, setMagnitude] = useState(motor.number);
  const [unit, setUnit] = useState(motor.data.name);

  useEffect(() => {
    setMotor({
      number: cleanNumberInput(magnitude),
      data: motorMap[unit],
    });
  }, [magnitude, unit]);

  return (
    <UnlabeledTypedNumberInput
      magnitudeStateHook={[magnitude, setMagnitude]}
      selectStateHook={[unit, setUnit]}
      choices={props.choices}
    />
  );
}

export function LabeledMotorInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <UnlabeledMotorInput {...props} />
      </div>
    </div>
  );
}
