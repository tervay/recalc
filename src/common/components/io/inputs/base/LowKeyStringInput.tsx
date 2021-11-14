import { StateHook } from "common/models/ExtraTypes";

export default function LowKeyStringInput(props: {
  stateHook: StateHook<string>;
  disabled?: boolean;
}): JSX.Element {
  const [s, setS] = props.stateHook;
  const classes = [
    "lowkey-input",
    props.disabled ? "has-text-black" : "has-text-white",
  ];

  return (
    <input
      className={classes.join(" ")}
      type="text"
      placeholder="Piston Name"
      defaultValue={s}
      onBlur={(e) => setS(e.target.value)}
    />
  );
}
