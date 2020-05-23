import React, { useState, useEffect } from "react";
import Qty from "js-quantities";

export function QtyInput(props) {
  // Prepare inputs
  const [unit, setUnit] = useState(props.initialUnit || props.choices[0]);
  const [magnitude, setMagnitude] = useState(props.qty.scalar);

  // Update
  useEffect(() => {
    props.setQuery({
      [props.name]: Qty(Number(magnitude === "." ? 0 : magnitude), unit),
    });
  }, [magnitude, unit]);

  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <div className="field has-addons">
          <p className="control is-expanded">
            <input
              className="input input-right"
              value={magnitude}
              onChange={(e) => {
                setMagnitude(e.target.value);
              }}
            />
          </p>
          <p className="control">
            <span className="select">
              <select
                defaultValue={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                }}
              >
                {props.choices.map((c) => {
                  return <option key={c}>{c}</option>;
                })}
              </select>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function QtyOutput(props) {
  // Prepare inputs
  const [unit, setUnit] = useState(props.initialUnit || props.choices[0]);

  let inputClasses = "input input-right";
  let selectClasses = "select";
  if (props.redIf && props.redIf()) {
    inputClasses += " is-danger";
    selectClasses += " is-danger";
  } else if (props.greenIf && props.greenIf()) {
    inputClasses += " is-success";
    selectClasses += " is-success";
  }

  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <div className="field has-addons">
          <p className="control is-expanded">
            <input
              disabled
              className={inputClasses}
              value={String(props.qty.to(unit).scalar.toFixed(props.precision))}
            />
          </p>
          <p className="control">
            <span className={selectClasses}>
              <select
                defaultValue={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                }}
              >
                {props.choices.map((c) => {
                  return <option key={c}>{c}</option>;
                })}
              </select>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
