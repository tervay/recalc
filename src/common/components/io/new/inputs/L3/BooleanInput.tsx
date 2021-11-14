import L0Boolean, {
  makeDefaultL0BooleanProps,
} from "common/components/io/new/inputs/L0/L0Boolean";
import { BooleanInputProps } from "common/components/io/new/inputs/types/Types";

export default function BooleanInput(props: BooleanInputProps): JSX.Element {
  return <L0Boolean {...makeDefaultL0BooleanProps(props)} />;
}
