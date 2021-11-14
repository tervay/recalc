import L1ControlledNumber, {
  makeDefaultL1ControlledNumberProps,
} from "common/components/io/new/inputs/L1/L1ControlledNumber";
import { NumberInputProps } from "common/components/io/new/inputs/types/Types";

export default function NumberInput(props: NumberInputProps): JSX.Element {
  return (
    <L1ControlledNumber
      {...makeDefaultL1ControlledNumberProps<number, typeof props>(props)}
      makeNumber={(n) => n}
      fromNumber={(n) => n}
    />
  );
}
