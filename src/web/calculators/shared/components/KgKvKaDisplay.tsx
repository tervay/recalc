import Measurement from "common/models/Measurement";
import SingleInputLine from "../../../../common/components/io/inputs/SingleInputLine";
import MeasurementOutput from "../../../../common/components/io/outputs/MeasurementOutput";
import KvKaDisplay, { KvKaDisplayProps } from "./KvKaDisplay";

export interface KgKvKaDisplayProps extends KvKaDisplayProps {
  kG: Measurement;
}

export default function KgKvKaDisplay({
  kG,
  kV,
  kA,
  angular,
}: KgKvKaDisplayProps): JSX.Element {
  return (
    <>
      <SingleInputLine
        label="Estimated kG"
        id="kG"
        tooltip="Gravity feedforward constant of the mechanism (assumes vertical orientation for linear mechanisms)."
      >
        <MeasurementOutput
          stateHook={[kG, () => undefined]}
          numberRoundTo={2}
          defaultUnit="V"
        />
      </SingleInputLine>
      <KvKaDisplay kV={kV} kA={kA} angular={angular} />
    </>
  );
}
