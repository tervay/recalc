import {
  getColorableClass,
  getRoundClass,
  getSizeClass,
} from "common/components/io/classes";
import { L0NumberProps } from "common/components/io/new/inputs/types/Types";
import { SafelyParse } from "common/tooling/io";
import { useEffect, useState } from "react";

export default function L0Number(props: L0NumberProps): JSX.Element {
  const [value, setValue] = props.stateHook;
  const [stringValue, setStringValue] = useState(value.toString());

  const classes = [
    "input",
    "input-right",
    getColorableClass(props),
    getSizeClass(props),
    getRoundClass(props),
  ];

  useEffect(() => {
    const timeoutId = setTimeout(
      () => setValue(SafelyParse(stringValue)),
      props.delay,
    );

    return () => clearTimeout(timeoutId);
  }, [stringValue]);

  useEffect(() => {
    if (props.disabledIf()) {
      setStringValue(value.toFixed(props.roundTo));
    }
  }, [value]);

  return (
    <input
      type="number"
      className={classes.join(" ")}
      value={stringValue}
      onChange={(e) => setStringValue(e.target.value)}
      id={props.id}
      data-testid={props.id}
      disabled={props.disabledIf()}
    />
  );
}
