import {
  getColorableClass,
  getRoundClass,
  getSizeClass,
} from "common/components/io/classes";
import { L0NumberProps } from "common/components/io/new/inputs/types/Types";
import { SafelyParse } from "common/tooling/io";
import { useEffect, useState } from "react";

interface StyledL0NumberProps extends L0NumberProps {
  style?: React.CSSProperties;
}

export default function L0Number(props: StyledL0NumberProps): JSX.Element {
  const [value, setValue] = props.stateHook;
  const [stringValue, setStringValue] = useState(
    props.roundTo < 100 ? value.toFixed(props.roundTo) : value.toString(),
  );

  const classes = [
    "input",
    "input-right",
    getColorableClass(props),
    getSizeClass(props),
    getRoundClass(props),
  ];

  useEffect(() => {
    if (!props.disabledIf()) {
      const timeoutId = setTimeout(
        () => setValue(SafelyParse(stringValue)),
        props.delay,
      );

      return () => clearTimeout(timeoutId);
    }
  }, [stringValue]);

  useEffect(() => {
    if (props.disabledIf()) {
      setStringValue(
        props.roundTo < 100 ? value.toFixed(props.roundTo) : value.toString(),
      );
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
      step={props.step}
      style={props.style}
    />
  );
}
