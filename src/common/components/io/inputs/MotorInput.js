import { UnlabeledTypedNumberInput } from "common/components/io/inputs/TypedNumberInput";
import { cleanNumberInput } from "common/tooling/io";
import { motorMap } from "common/tooling/motors";
import propTypes from "prop-types";
import React, { useEffect, useState } from "react";

export function UnlabeledMotorInput(props) {
  const [motor, setMotor] = props.stateHook;
  const [magnitude, setMagnitude] = useState(motor.quantity);
  const [unit, setUnit] = useState(motor.data.name);

  useEffect(() => {
    setMotor({
      quantity: cleanNumberInput(magnitude),
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

UnlabeledMotorInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  choices: propTypes.arrayOf(propTypes.string),
};

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

LabeledMotorInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  choices: propTypes.arrayOf(propTypes.string),
  label: propTypes.string,
};
