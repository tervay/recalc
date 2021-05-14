import { uuid } from "common/tooling/util";
import propTypes from "prop-types";
import { useEffect } from "react";

export default function ChainInput(props) {
  props = { ...props, selectId: props.selectId || uuid() };

  const [chain, setChain] = props.stateHook;

  useEffect(() => {
    setChain(chain);
  }, [chain]);

  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label" htmlFor={props.selectId}>
          Chain
        </label>
      </div>
      <div className="field-body">
        <p className="control">
          <span className="select">
            <select
              defaultValue={chain}
              onChange={(e) => setChain(e.target.value)}
              id={props.selectId}
              data-testid={props.selectId}
            >
              {["#25", "#35", "#50 / Bike"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </span>
        </p>
      </div>
    </div>
  );
}

ChainInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  selectId: propTypes.string,
};
