import { uuid } from "common/tooling/util";
import propTypes from "prop-types";
import { useEffect } from "react";

export default function PressureAngleInput(props) {
  props = { ...props, selectId: props.selectId || uuid() };

  const [pressureAngle, setPressureAngle] = props.stateHook;

  useEffect(() => {
    setPressureAngle(pressureAngle);
  }, [pressureAngle]);

  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label" htmlFor={props.selectId}>
          Pressure Angle
        </label>
      </div>
      <div className="field-body">
        <p className="control">
          <span className="select">
            <select
              defaultValue={pressureAngle}
              onChange={(e) => setPressureAngle(e.target.value)}
              id={props.selectId}
              data-testid={props.selectId}
            >
              {["14.5°", "20°"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </span>
        </p>
      </div>
    </div>
  );
}

PressureAngleInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  selectId: propTypes.string,
};
