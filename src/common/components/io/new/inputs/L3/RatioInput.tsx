import L2NumberSelect from "common/components/io/new/inputs/L2/L2NumberSelect";
import { RatioInputProps } from "common/components/io/new/inputs/types/Types";
import Ratio, { RatioType } from "common/models/Ratio";

export default function RatioInput(props: RatioInputProps): JSX.Element {
  const [ratio, _] = props.stateHook;

  return (
    <L2NumberSelect
      {...props}
      choices={[RatioType.REDUCTION, RatioType.STEP_UP]}
      fromNumber={(n) => new Ratio(n, ratio.ratioType)}
      makeNumber={(r) => r.magnitude}
      fromString={(s) =>
        new Ratio(
          ratio.magnitude,
          s.toLowerCase() === "reduction"
            ? RatioType.REDUCTION
            : RatioType.STEP_UP
        )
      }
      makeString={(r) => r.ratioType}
      dangerIf={() => ratio.asNumber() === 0}
    />
  );
}
