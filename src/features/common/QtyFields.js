import Qty from "js-quantities";
import React, { useEffect, useState } from "react";
import { PrepInputState } from "../../utils";

export function QtyInputCore(props) {
  // Prepare inputs
  const [unit, setUnit] = useState(props.qty.units() || props.choices[0]);
  const [magnitude, setMagnitude] = useState(props.qty.scalar);

  // Update
  useEffect(() => {
    const { valid, value } = PrepInputState(magnitude, props.allowsZero);
    if (valid) {
      props.setQuery({
        [props.name]: Qty(value, unit),
      });
    }
  }, [magnitude, unit]);

  const { valid, value } = PrepInputState(magnitude, props.allowsZero);
  let inputClasses = "input input-right";
  let selectClasses = "select";
  if ((props.redIf && props.redIf()) || !valid) {
    inputClasses += " is-danger";
    selectClasses += " is-danger";
  } else if (props.greenIf && props.greenIf()) {
    inputClasses += " is-success";
    selectClasses += " is-success";
  }

  return (
    <div className="field has-addons">
      <p className="control is-expanded">
        <input
          type="number"
          className={inputClasses}
          value={magnitude}
          onChange={(e) => {
            setMagnitude(e.target.value);
          }}
        />
      </p>
      <p className="control">
        <span className="select" className={selectClasses}>
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
  );
}

export function QtyInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <QtyInputCore {...props} />
      </div>
    </div>
  );
}

export function QtyOutputCore(props) {
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
  );
}

export function QtyOutput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <QtyOutputCore {...props} />
      </div>
    </div>
  );
}
