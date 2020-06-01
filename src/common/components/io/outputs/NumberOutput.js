import React from "react";

export function UnlabeledNumberOutput(props) {
  const [value, setValue] = props.stateHook;

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
