import L1ControlledNumber, {
  makeDefaultL1ControlledNumberProps,
} from "common/components/io/new/inputs/L1/L1ControlledNumber";
import L1ControlledSelect, {
  makeDefaultL1ControlledSelectProps,
} from "common/components/io/new/inputs/L1/L1ControlledSelect";
import {
  L2NumberSelectProps,
  SetAllFieldsButStateHookOptional,
} from "common/components/io/new/inputs/types/Types";
import {
  RemoveL1NumberCreationFns,
  RemoveL1SelectCreationFns,
} from "common/components/io/new/inputs/types/Utility";

interface StyledL2NumberSelectProps<T> extends L2NumberSelectProps<T> {
  style?: React.CSSProperties;
}

export default function L2NumberSelect<T>(
  props: StyledL2NumberSelectProps<T>,
): JSX.Element {
  const defaultSelectProps: SetAllFieldsButStateHookOptional<
    RemoveL1SelectCreationFns<T>
  > = {
    dangerIf: props.dangerIf,
    // expanded: props.expanded,
    expanded: false,
    id: props.selectId,
    infoIf: props.infoIf,
    linkIf: props.linkIf,
    loadingIf: props.loadingIf,
    primaryIf: props.primaryIf,
    rounded: props.rounded,
    size: props.size,
    stateHook: props.stateHook,
    successIf: props.successIf,
    warningIf: props.warningIf,
  };
  const defaultNumberProps: SetAllFieldsButStateHookOptional<
    RemoveL1NumberCreationFns<T>
  > = {
    dangerIf: props.dangerIf,
    delay: props.numberDelay,
    disabledIf: props.numberDisabledIf,
    expanded: props.expanded,
    id: props.numberId,
    infoIf: props.infoIf,
    linkIf: props.linkIf,
    loadingIf: props.loadingIf,
    primaryIf: props.primaryIf,
    readonly: props.numberReadonly,
    roundTo: props.numberRoundTo,
    rounded: props.rounded,
    size: props.size,
    stateHook: props.stateHook,
    static: props.numberStatic,
    successIf: props.successIf,
    warningIf: props.warningIf,
  };

  return (
    <div className="field has-addons">
      <L1ControlledNumber
        fromNumber={props.fromNumber}
        makeNumber={props.makeNumber}
        {...makeDefaultL1ControlledNumberProps<T, typeof defaultNumberProps>(
          defaultNumberProps,
        )}
        skipControl={true}
        step={props.numberStep}
        style={props.style}
      />
      <L1ControlledSelect
        choices={props.choices}
        fromString={props.fromString}
        makeString={props.makeString}
        {...makeDefaultL1ControlledSelectProps<T, typeof defaultSelectProps>(
          defaultSelectProps,
        )}
        skipControl={true}
      />
    </div>
  );
}
