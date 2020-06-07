import React from "react";

export function UnlabeledTypedNumberInput(props) {
  const [magnitude, setMagnitude] = props.magnitudeStateHook;
  const [select, setSelect] = props.selectStateHook;

  return (
    <div className="field has-addons">
      <p className="control is-expanded">
        <input
          type="number"
          className="input input-right"
          value={magnitude}
          onChange={(e) => setMagnitude(e.target.value)}
          style={{ minWidth: "5em" }}
        />
      </p>
      <p className="control">
        <span className="select">
          <select
            defaultValue={select}
            onChange={(e) => setSelect(e.target.value)}
          >
            {props.choices.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </span>
      </p>
    </div>
  );
}

export function LabeledTypedNumberInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className={"label " + props.labelClasses}>{props.label}</label>
      </div>
      <div className="field-body">
        <UnlabeledTypedNumberInput {...props} />
      </div>
    </div>
  );
}
