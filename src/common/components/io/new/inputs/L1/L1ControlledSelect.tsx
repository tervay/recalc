import { makeDefaultControlFieldProps } from "common/components/io/new/inputs/Control";
import L0Select from "common/components/io/new/inputs/L0/L0Select";
import {
  L1ControlledSelectProps,
  SetAllFieldsButStateHookOptional,
} from "common/components/io/new/inputs/types/Types";
import { RemoveL1SelectCreationFns } from "common/components/io/new/inputs/types/Utility";
import { ReturnFalse, uuid } from "common/tooling/util";
import { useEffect, useState } from "react";

export function makeDefaultL1ControlledSelectProps<
  M,
  T extends SetAllFieldsButStateHookOptional<RemoveL1SelectCreationFns<M>>
>(props: T): RemoveL1SelectCreationFns<M> {
  return {
    ...{
      dangerIf: props.dangerIf ?? ReturnFalse,
      infoIf: props.infoIf ?? ReturnFalse,
      linkIf: props.linkIf ?? ReturnFalse,
      loadingIf: props.loadingIf ?? ReturnFalse,
      primaryIf: props.primaryIf ?? ReturnFalse,
      successIf: props.successIf ?? ReturnFalse,
      warningIf: props.warningIf ?? ReturnFalse,
      id: props.id ?? uuid(),
      rounded: props.rounded ?? false,
      size: props.size ?? "normal",
      stateHook: props.stateHook,
    },
    ...makeDefaultControlFieldProps(props),
  };
}

export default function L1ControlledSelect<T>(
  props: L1ControlledSelectProps<T>
): JSX.Element {
  const [t, setT] = props.stateHook;
  const [string, setString] = useState(props.makeString(t));

  useEffect(() => {
    setT(props.fromString(string));
  }, [string]);

  useEffect(() => {
    setString(props.makeString(t));
  }, [t]);

  return (
    // <Control expanded={props.expanded} skipControl={props.skipControl}>
    <L0Select
      id={props.id}
      choices={props.choices}
      dangerIf={props.dangerIf}
      infoIf={props.infoIf}
      linkIf={props.linkIf}
      primaryIf={props.primaryIf}
      successIf={props.successIf}
      warningIf={props.warningIf}
      loadingIf={props.loadingIf}
      rounded={props.rounded}
      size={props.size}
      stateHook={[string, setString]}
    />
    // </Control>
  );
}
