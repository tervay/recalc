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
};

export function LabeledNumberInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <span
          className="has-tooltip-right"
          data-tooltip={toolTipForIds(props.inputId, props.label)}
        >
          <label className="label">{props.label}</label>
        </span>
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
