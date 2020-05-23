import React, { useState, useEffect } from "react";
import Qty from "js-quantities";

export function QtyInputCore(props) {
  // Prepare inputs
  const [unit, setUnit] = useState(props.qty._units || props.choices[0]);
  const [magnitude, setMagnitude] = useState(props.qty.scalar);

  // Update
  useEffect(() => {
    let val = NaN;
    switch (magnitude) {
      case ".":
        val = 0;
        break;
      case "-":
        val = 0;
        break;
      default:
        val = Number(magnitude);
        break;
    }

    if (val !== NaN) {
      props.setQuery({
        [props.name]: Qty(val, unit),
      });
    }
  }, [magnitude, unit]);

  return (
    <div className="field has-addons">
      <p className="control is-expanded">
        <input
          type="number"
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
