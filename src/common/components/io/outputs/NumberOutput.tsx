import { NumberInput } from "common/components/io/new/inputs";
import {
  Disableable,
  NumberInputProps,
} from "common/components/io/new/inputs/types/Types";
import { Exclude } from "ts-toolbelt/out/Object/Exclude";

export default function NumericOutput(
  props: Exclude<NumberInputProps, Disableable>
): JSX.Element {
  return <NumberInput {...props} disabledIf={() => true} />;
}
