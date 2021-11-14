import L1ControlledSelect, {
  makeDefaultL1ControlledSelectProps,
} from "common/components/io/new/inputs/L1/L1ControlledSelect";
import { CompressorInputProps } from "common/components/io/new/inputs/types/Types";
import Compressor from "common/models/Compressor";

export default function CompressorInput(
  props: CompressorInputProps
): JSX.Element {
  return (
    <L1ControlledSelect
      {...makeDefaultL1ControlledSelectProps<Compressor, typeof props>(props)}
      choices={Compressor.getAllChoices()}
      makeString={(c) => c.identifier}
      fromString={(s) => Compressor.fromIdentifier(s)}
    />
  );
}
