import L1ControlledSelect, {
  makeDefaultL1ControlledSelectProps,
} from "common/components/io/new/inputs/L1/L1ControlledSelect";
import { GenericSelectInputProps } from "common/components/io/new/inputs/types/Types";

export default function GenericSelect<T>(
  props: GenericSelectInputProps<T> & {
    choices: string[];
    makeString: (t: T) => string;
    fromString: (s: string) => T;
  },
): JSX.Element {
  return (
    <L1ControlledSelect
      {...makeDefaultL1ControlledSelectProps<T, typeof props>(props)}
      {...props}
    />
  );
}
