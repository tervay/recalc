import { UnlabeledTypedNumberInput } from "common/components/io/inputs/TypedNumberInput";
import { toolTipForIds } from "common/components/tooltips";
import Measurement from "common/models/Measurement";
import { cleanNumberInput } from "common/tooling/io";
import { uuid } from "common/tooling/util";
import propTypes from "prop-types";
import { useEffect, useState } from "react";

export function UnlabeledQtyInput(props) {
  const [qty, setQty] = props.stateHook;
  const [magnitude, setMagnitude] = useState(qty.scalar);
  const [unit, setUnit] = useState(qty.units());

  if (
    props.disabled &&
    props.stateHook[0].scalar.toString() !== magnitude.toString()
  ) {
    setMagnitude(props.stateHook[0].scalar);
  }

  useEffect(() => {
    setQty(new Measurement(cleanNumberInput(magnitude), unit));
  }, [magnitude, unit]);

  return (
    <UnlabeledTypedNumberInput
      magnitudeStateHook={[magnitude, setMagnitude]}
      selectStateHook={[unit, setUnit]}
      choices={props.choices}
      inputId={props.inputId}
      selectId={props.selectId}
      disabled={props.disabled}
    />
  );
}

UnlabeledQtyInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  choices: propTypes.arrayOf(propTypes.string),
  inputId: propTypes.string,
  selectId: propTypes.string,
  disabled: propTypes.bool,
};

export function LabeledQtyInput(props) {
  props = {
    ...props,
    inputId: props.inputId || uuid(),
    labelFg: props.labelFg || 1,
  };

  return (
    <div
      className={"field is-horizontal" + (props.wideLabel ? " wide-label" : "")}
    >
      <div className={`field-label is-normal fg-${props.labelFg}`}>
        <label className="label" htmlFor={props.inputId}>
          <span
            className="has-tooltip-right"
            data-tooltip={toolTipForIds(props.inputId, props.abbr, props.label)}
          >
            {props.label}
          </span>
        </label>
      </div>
      <div className="field-body">
        <UnlabeledQtyInput {...props} />
      </div>
    </div>
  );
}

LabeledQtyInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  label: propTypes.string,
  choices: propTypes.arrayOf(propTypes.string),
  abbr: propTypes.string,
  wideLabel: propTypes.bool,
  inputId: propTypes.string,
  selectId: propTypes.string,
  disabled: propTypes.bool,
  labelFg: propTypes.number,
};
