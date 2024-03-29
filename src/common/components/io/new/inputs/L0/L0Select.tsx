import {
  getColorableClass,
  getLoadingClass,
  getRoundClass,
  getSizeClass,
} from "common/components/io/classes";
import { L0SelectProps } from "common/components/io/new/inputs/types/Types";

export default function L0Select(props: L0SelectProps): JSX.Element {
  const [value, setValue] = props.stateHook;
  const classes = [
    "select",
    getColorableClass(props),
    getSizeClass(props),
    getLoadingClass(props),
    getRoundClass(props),
  ];

  return (
    <div className={classes.join(" ")}>
      <select
        defaultValue={value}
        onChange={(e) => setValue(e.target.value)}
        id={props.id}
        data-testid={props.id}
      >
        {props.choices.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
