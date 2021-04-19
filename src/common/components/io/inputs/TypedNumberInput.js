import propTypes from "prop-types";

import { UnlabeledNumberInput } from "./NumberInput";

export function UnlabeledTypedNumberInput(props) {
  const [magnitude, setMagnitude] = props.magnitudeStateHook;
  const [select, setSelect] = props.selectStateHook;

  return (
    <UnlabeledNumberInput
      stateHook={[magnitude, setMagnitude]}
      inputId={props.inputId}
      disabled={props.disabled}
    >
      <p className="control">
        <span className="select">
          <select
            value={select}
            onChange={(e) => setSelect(e.target.value)}
            id={props.selectId}
            data-testid={props.selectId}
            disabled={props.disabled}
          >
            {props.choices.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </span>
      </p>
    </UnlabeledNumberInput>
  );
}

export function LabeledTypedNumberInput(props) {
  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className={"label " + props.labelClasses}>{props.label}</label>
      </div>
      <div className="field-body">
        <UnlabeledTypedNumberInput {...props} />
      </div>
    </div>
  );
}

UnlabeledTypedNumberInput.propTypes = {
  magnitudeStateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  selectStateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  choices: propTypes.arrayOf(propTypes.string),
  inputId: propTypes.string,
  selectId: propTypes.string,
  disabled: propTypes.bool,
};

LabeledTypedNumberInput.propTypes = {
  magnitudeStateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  selectStateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  choices: propTypes.arrayOf(propTypes.string),
  label: propTypes.string,
  labelClasses: propTypes.string,
  inputId: propTypes.string,
  selectId: propTypes.string,
};
