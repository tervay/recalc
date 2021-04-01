import propTypes from "prop-types";
import React from "react";

export default function BooleanInput(props) {
  const [value, setValue] = props.stateHook;

  return (
    <label className="checkbox">
      <input
        type="checkbox"
        defaultChecked={value}
        onChange={(e) => setValue(e.target.checked)}
      />
      {props.label}
    </label>
  );
}

BooleanInput.propTypes = {
  stateHook: propTypes.array,
  label: propTypes.string,
};
