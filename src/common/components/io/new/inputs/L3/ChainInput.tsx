import L1ControlledSelect, {
  makeDefaultL1ControlledSelectProps,
} from "common/components/io/new/inputs/L1/L1ControlledSelect";
import { ChainInputProps } from "common/components/io/new/inputs/types/Types";
import Chain from "common/models/Chain";

export default function ChainInput(props: ChainInputProps): JSX.Element {
  return (
    <L1ControlledSelect
      {...makeDefaultL1ControlledSelectProps<Chain, typeof props>(props)}
      choices={Chain.getAllChoices()}
      makeString={(c) => c.identifier}
      fromString={(s) => Chain.fromDict({ name: s })}
    />
  );
}
