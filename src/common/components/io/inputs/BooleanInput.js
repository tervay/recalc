import { uuid } from "common/tooling/util";
import propTypes from "prop-types";

export default function BooleanInput(props) {
  const [value, setValue] = props.stateHook;
  props = { ...props, inputId: props.inputId || uuid() };

  return (
    <label className="checkbox" htmlFor={props.inputId}>
      <input
        id={props.inputId}
        type="checkbox"
        defaultChecked={value}
        onClick={(e) => setValue(e.target.checked)}
        data-testid={props.inputId}
      />
      <span>{props.label}</span>
    </label>
  );
}

BooleanInput.propTypes = {
  stateHook: propTypes.array,
  label: propTypes.string,
  inputId: propTypes.string,
};
