import Control, {
  makeDefaultControlFieldProps,
} from "common/components/io/new/inputs/Control";
import L0Number from "common/components/io/new/inputs/L0/L0Number";
import {
  L1ControlledNumberProps,
  SetAllFieldsButStateHookOptional,
} from "common/components/io/new/inputs/types/Types";
import { RemoveL1NumberCreationFns } from "common/components/io/new/inputs/types/Utility";
import { ReturnFalse, uuid } from "common/tooling/util";
import { useEffect, useState } from "react";

export function makeDefaultL1ControlledNumberProps<
  M,
  T extends SetAllFieldsButStateHookOptional<RemoveL1NumberCreationFns<M>>,
>(props: T): RemoveL1NumberCreationFns<M> {
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
      delay: props.delay ?? 0,
      disabledIf: props.disabledIf ?? ReturnFalse,
      readonly: props.readonly ?? false,
      roundTo: props.roundTo ?? 100,
      static: props.static ?? false,
    },
    ...makeDefaultControlFieldProps(props),
  };
}

export default function L1ControlledNumber<T>(
  props: L1ControlledNumberProps<T>,
): JSX.Element {
  const [t, setT] = props.stateHook;
  const [num, setNum] = useState(props.makeNumber(t));

  useEffect(() => {
    if (!props.disabledIf()) {
      setT(props.fromNumber(num));
    }
  }, [num]);

  useEffect(() => {
    if (props.disabledIf()) {
      setNum(props.makeNumber(t));
    }
  }, [t]);

  return (
    <Control expanded={props.expanded} skipControl={props.skipControl}>
      <L0Number
        id={props.id}
        dangerIf={props.dangerIf}
        delay={props.delay}
        disabledIf={props.disabledIf}
        infoIf={props.infoIf}
        linkIf={props.linkIf}
        primaryIf={props.primaryIf}
        successIf={props.successIf}
        warningIf={props.warningIf}
        readonly={props.readonly}
        roundTo={props.roundTo}
        rounded={props.rounded}
        stateHook={[num, setNum]}
        static={props.static}
        size={props.size}
      />
    </Control>
  );
}
