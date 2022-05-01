import { RatioInput } from "common/components/io/new/inputs";
import {
  Disableable,
  RatioInputProps,
} from "common/components/io/new/inputs/types/Types";

export default function RatioOutput(
  props: Exclude<RatioInputProps, Disableable>
): JSX.Element {
  return <RatioInput {...props} numberDisabledIf={() => true} />;
}
