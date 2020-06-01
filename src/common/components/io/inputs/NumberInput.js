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
        />
      </p>
    </div>
  );
}

export function LabeledNumberInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <UnlabeledNumberInput {...props} />
      </div>
    </div>
  );
}
