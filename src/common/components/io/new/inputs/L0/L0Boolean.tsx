import {
  BooleanInputProps,
  L0BooleanProps,
} from "common/components/io/new/inputs/types/Types";
import { uuid } from "common/tooling/util";

export function makeDefaultL0BooleanProps<T extends BooleanInputProps>(
  props: T,
): L0BooleanProps {
  return {
    id: props.id ?? uuid(),
    stateHook: props.stateHook,
  };
}

export default function L0Boolean(props: L0BooleanProps): JSX.Element {
  const [val, setVal] = props.stateHook;

  return (
    <div className="field">
      <div className="control">
        <label className="checkbox">
          <input
            type="checkbox"
            className="recalc-switch"
            onChange={(e) => setVal(e.target.checked)}
            defaultChecked={val}
            id={props.id}
            data-testid={props.id}
          />
        </label>
      </div>
    </div>
  );
}
