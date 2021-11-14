import { MeasurementInput } from "common/components/io/new/inputs";
import {
  Disableable,
  MeasurementInputProps,
} from "common/components/io/new/inputs/types/Types";
import { Exclude } from "ts-toolbelt/out/Object/Exclude";

export default function MeasurementOutput(
  props: Exclude<MeasurementInputProps, Disableable>
): JSX.Element {
  return <MeasurementInput {...props} numberDisabledIf={() => true} />;
}
