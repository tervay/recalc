import { getExpandedClass } from "common/components/io/classes";
import { ControlFieldProps } from "common/components/io/new/inputs/types/Types";

export function makeDefaultControlFieldProps<
  T extends Partial<Omit<ControlFieldProps, "children">>
>(props: T): Omit<ControlFieldProps, "children"> {
  return {
    expanded: props.expanded ?? false,
    skipControl: props.skipControl ?? false,
  };
}

function SkippableControlWrapper(props: ControlFieldProps): JSX.Element {
  return props.skipControl ? (
    <>{props.children}</>
  ) : (
    <div className="field has-addons">{props.children}</div>
  );
}

export default function Control(props: ControlFieldProps): JSX.Element {
  const classes = ["control", getExpandedClass(props)];
  return (
    <SkippableControlWrapper {...props}>
      <div className={classes.join(" ")}>{props.children}</div>
    </SkippableControlWrapper>
  );
}
