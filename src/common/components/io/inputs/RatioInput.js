import { UnlabeledTypedNumberInput } from "common/components/io/inputs/TypedNumberInput";
import { cleanNumberInput } from "common/tooling/io";
import { motorMap } from "common/tooling/motors";
import React, { useEffect, useState } from "react";
import { RATIO_STEPUP, RATIO_REDUCTION } from "common/tooling/query-strings";

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
