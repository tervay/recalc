import { uuid } from "common/tooling/util";
import propTypes from "prop-types";
import { useEffect, useState } from "react";

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
      <p
        className={
          "control is-expanded" + (props.isLoading ? " is-loading" : "")
        }
      >
        <input
          disabled
          className={"input input-right"}
          value={value}
          id={props.inputId}
          data-testid={props.inputId}
        />
      </p>
      <p className="control">
        <span className="select">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            id={props.selectId}
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

UnlabeledQtyOutput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  choices: propTypes.arrayOf(propTypes.string),
  precision: propTypes.number,
  inputId: propTypes.string,
  selectId: propTypes.string,
  isLoading: propTypes.bool,
};

export function LabeledQtyOutput(props) {
  props = { ...props, inputId: props.inputId || uuid() };
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label" htmlFor={props.inputId}>
          {props.label}
        </label>
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
  inputId: propTypes.string,
  selectId: propTypes.string,
  isLoading: propTypes.bool,
};
