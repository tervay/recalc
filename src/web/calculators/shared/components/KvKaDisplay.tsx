import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import Measurement from "common/models/Measurement";

export interface KvKaDisplayProps {
  kV: Measurement;
  kA: Measurement;
  distanceType: "linear" | "angular";
}

export default function KvKaDisplay({
  kV,
  kA,
  distanceType,
}: KvKaDisplayProps): JSX.Element {
  const defaultDistanceUnit = distanceType == "angular" ? "rad" : "m";
  return (
    <>
      <SingleInputLine
        label="Estimated kV"
        id="kV"
        tooltip="Velocity feedforward constant of the mechanism."
      >
        <MeasurementOutput
          stateHook={[kV, () => undefined]}
          numberRoundTo={2}
          defaultUnit={`V*s/${defaultDistanceUnit}`}
        />
      </SingleInputLine>
      <SingleInputLine
        label="Estimated kA"
        id="kA"
        tooltip="Acceleration feedforward constant of the mechanism."
      >
        <MeasurementOutput
          stateHook={[kA, () => undefined]}
          numberRoundTo={2}
          defaultUnit={`V*s^2/${defaultDistanceUnit}`}
        />
      </SingleInputLine>
      <SingleInputLine
        label="Response Time"
        id="timescale"
        tooltip="Characteristic timescale of the mechanism response; 
            control loop period and total signal delay should be at least 
            3-5 times shorter than this to optimally control the mechanism."
      >
        <MeasurementOutput
          stateHook={[kA.div(kV), () => undefined]}
          numberRoundTo={2}
          defaultUnit="s"
        />
      </SingleInputLine>
    </>
  );
}
