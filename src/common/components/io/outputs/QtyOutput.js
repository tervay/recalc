import propTypes from "prop-types";
import React, { useEffect, useState } from "react";

export function UnlabeledQtyOutput(props) {
  const [qty, setQty] = props.stateHook;
  const [unit, setUnit] = useState(qty.units());

  useEffect(() => {
    setQty(qty.to(unit));
  }, [unit]);

  const value = props.precision
    ? qty.to(unit).scalar.toFixed(props.precision)
    : qty.to(unit).scalar;

  return (
    <div className="field has-addons">
      <p className="control is-expanded">
        <input disabled className="input input-right" value={value} />
      </p>
      <p className="control">
        <span className="select">
          <select defaultValue={unit} onChange={(e) => setUnit(e.target.value)}>
            {props.choices.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </span>
      </p>
    </div>
  );
}

UnlabeledQtyOutput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  choices: propTypes.arrayOf(propTypes.string),
  precision: propTypes.number,
};

export function LabeledQtyOutput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <UnlabeledQtyOutput {...props} />
      </div>
    </div>
  );
}

LabeledQtyOutput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  choices: propTypes.arrayOf(propTypes.string),
  precision: propTypes.number,
  label: propTypes.string,
};
