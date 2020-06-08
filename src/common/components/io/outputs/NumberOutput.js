import propTypes from "prop-types";
import React from "react";

export function UnlabeledNumberOutput(props) {
  const value = props.stateHook[0];

  return (
    <div className="field has-addons">
      <p className="control is-expanded">
        <input
          type="number"
          disabled
          className="input input-right"
          value={value}
        />
      </p>
    </div>
  );
}

UnlabeledNumberOutput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
};

export function LabeledNumberOutput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <UnlabeledNumberOutput {...props} />
      </div>
    </div>
  );
}

LabeledNumberOutput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  label: propTypes.string,
};
