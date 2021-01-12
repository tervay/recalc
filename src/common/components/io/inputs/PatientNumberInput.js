import propTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { toolTipForIds } from "common/components/tooltips";

export function UnlabeledPatientNumberInput(props) {
  const [value, setValue] = props.stateHook;
  const [preValue, setPreValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setValue(preValue), props.delay);
    return () => clearTimeout(timeoutId);
  }, [preValue]);

  return (
    <div className="field has-addons">
      <p className="control is-expanded">
        <input
          type="number"
          className="input input-right"
          value={preValue}
          onChange={(e) => setPreValue(e.target.value)}
          id={props.inputId}
        />
      </p>
      {props.children}
    </div>
  );
}

UnlabeledPatientNumberInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  inputId: propTypes.string,
  children: propTypes.any,
  delay: propTypes.number,
};

export function LabeledPatientNumberInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
      <span className="has-tooltip-right"  data-tooltip={toolTipForIds(props.inputId, props.label)}>
          <label className="label">{props.label}</label>
        </span>
      </div>
      <div className="field-body">
        <UnlabeledPatientNumberInput {...props} />
      </div>
    </div>
  );
}

LabeledPatientNumberInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  label: propTypes.string,
  inputId: propTypes.string,
  delay: propTypes.number,
};
