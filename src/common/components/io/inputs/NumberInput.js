import { toolTipForIds } from "common/components/tooltips";
import propTypes from "prop-types";
import React from "react";

export function UnlabeledNumberInput(props) {
  const [value, setValue] = props.stateHook;

  return (
    <div className="field has-addons">
      <p className="control is-expanded">
        <input
          type="number"
          className="input input-right"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          id={props.inputId}
          disabled={props.disabled}
        />
      </p>
      {props.children}
    </div>
  );
}

UnlabeledNumberInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  inputId: propTypes.string,
  children: propTypes.any,
  disabled: propTypes.bool,
};

export function LabeledNumberInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">
          <span
            className="has-tooltip-right"
            data-tooltip={toolTipForIds(props.inputId, props.label)}
          >
            {props.label}
          </span>
        </label>
      </div>
      <div className="field-body">
        <UnlabeledNumberInput {...props} />
      </div>
    </div>
  );
}

LabeledNumberInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  label: propTypes.string,
  inputId: propTypes.string,
};
