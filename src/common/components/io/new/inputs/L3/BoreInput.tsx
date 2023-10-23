import L1ControlledSelect, {
  makeDefaultL1ControlledSelectProps,
} from "common/components/io/new/inputs/L1/L1ControlledSelect";
import { BoreInputProps } from "common/components/io/new/inputs/types/Types";
import { Bore, MotorBores, NonMotorBores } from "common/models/ExtraTypes";

export default function BoreInput(props: BoreInputProps): JSX.Element {
  return (
    <L1ControlledSelect
      {...makeDefaultL1ControlledSelectProps<Bore, typeof props>(props)}
      choices={[...MotorBores, ...NonMotorBores]}
      makeString={(b) => b}
      fromString={(s) => s as Bore}
    />
  );
}
