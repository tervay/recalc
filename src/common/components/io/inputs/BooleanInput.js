import propTypes from "prop-types";
import React from "react";

export default function BooleanInput(props) {
  const [value, setValue] = props.stateHook;

  return (
    <label className="checkbox">
      <input
        id={props.inputId}
        type="checkbox"
        defaultChecked={value}
        onClick={(e) => setValue(e.target.checked)}
      />
      <span>{props.label}</span>
    </label>
  );
}

BooleanInput.propTypes = {
  stateHook: propTypes.array,
  label: propTypes.string,
  inputId: propTypes.string,
};
