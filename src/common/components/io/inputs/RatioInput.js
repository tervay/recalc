import { UnlabeledTypedNumberInput } from "common/components/io/inputs/TypedNumberInput";
import { cleanNumberInput } from "common/tooling/io";
import { RATIO_REDUCTION, RATIO_STEPUP } from "common/tooling/query-strings";
import propTypes from "prop-types";
import React, { useEffect, useState } from "react";

export function UnlabeledRatioInput(props) {
  const [ratio, setRatio] = props.stateHook;
  const [amount, setAmount] = useState(ratio.amount);
  const [type, setType] = useState(ratio.type);

  useEffect(() => {
    setRatio({
      amount: cleanNumberInput(amount),
      type: type,
    });
  }, [amount, type]);

  return (
    <UnlabeledTypedNumberInput
      magnitudeStateHook={[amount, setAmount]}
      selectStateHook={[type, setType]}
      choices={[RATIO_STEPUP, RATIO_REDUCTION]}
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
