import { uuid } from "common/tooling/util";
import propTypes from "prop-types";

export default function BooleanInput(props) {
  const [value, setValue] = props.stateHook;
  props = { ...props, inputId: props.inputId || uuid() };

  return (
    <div
      className=""
      style={{
        paddingTop: "0.375rem",
      }}
    >
      <input
        id={props.inputId}
        type="checkbox"
        className="switch is-thin"
        defaultChecked={value}
        onClick={(e) => setValue(e.target.checked)}
        data-testid={props.inputId}
      />
      <label htmlFor={props.inputId}>{props.label}</label>
    </div>
  );
}

BooleanInput.propTypes = {
  stateHook: propTypes.array,
  label: propTypes.string,
  inputId: propTypes.string,
};
