import { UnlabeledTypedNumberInput } from "common/components/io/inputs/TypedNumberInput";
import Ratio from "common/models/Ratio";
import { cleanNumberInput } from "common/tooling/io";
import propTypes from "prop-types";
import React, { useEffect, useState } from "react";

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
    />
  );
}

UnlabeledRatioInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
};

export function LabeledRatioInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
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
};
