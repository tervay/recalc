import { UnlabeledTypedNumberInput } from "common/components/io/inputs/TypedNumberInput";
import { toolTipForIds } from "common/components/tooltips";
import Ratio from "common/models/Ratio";
import { cleanNumberInput } from "common/tooling/io";
import { uuid } from "common/tooling/util";
import propTypes from "prop-types";
import { useEffect, useState } from "react";

export function UnlabeledRatioInput(props) {
  const [ratio, setRatio] = props.stateHook;
  const [amount, setAmount] = useState(ratio.magnitude);
  const [type, setType] = useState(ratio.ratioType);

  useEffect(() => {
    setRatio({
      amount: cleanNumberInput(amount),
      type: type,
    });
    setRatio(new Ratio(cleanNumberInput(amount), type));
  }, [amount, type]);

  return (
    <UnlabeledTypedNumberInput
      magnitudeStateHook={[amount, setAmount]}
      selectStateHook={[type, setType]}
      choices={[Ratio.REDUCTION, Ratio.STEP_UP]}
      inputId={props.inputId}
    />
  );
}

UnlabeledRatioInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  inputId: propTypes.string,
};

export function LabeledRatioInput(props) {
  props = { ...props, inputId: props.inputId || uuid() };
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label" htmlFor={props.inputId}>
          <span
            className="has-tooltip-right"
            data-tooltip={toolTipForIds(props.inputId, props.label)}
          >
            {props.label}
          </span>
        </label>
      </div>
      <div className="field-body">
        <UnlabeledRatioInput {...props} />
      </div>
    </div>
  );
}

LabeledRatioInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  label: propTypes.string,
  inputId: propTypes.string,
};
