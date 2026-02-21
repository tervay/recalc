import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Divider } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import React from "react";

export interface FeedforwardAnalysisProps {
  kV: Measurement;
  kA: Measurement;
  distanceType: "linear" | "angular";
  kG?: Measurement;
  kVAlt?: Measurement;
  kAAlt?: Measurement;
}

const FeedforwardAnalysis: React.FC<FeedforwardAnalysisProps> = ({
  kG,
  kV,
  kA,
  distanceType,
  kVAlt,
  kAAlt,
}) => {
  return (
    <div>
      <Divider color="primary">Feedforward Gains</Divider>
      {kG !== undefined && (
        <SingleInputLine
          label="kG"
          id="kG"
          tooltip="Gravity feedforward gain.  The amount of voltage to apply to counteract the force of gravity. Assumes vertical orientation for linear mechanisms, and horizontal orientation for arms."
        >
          <MeasurementOutput
            stateHook={[kG, () => undefined]}
            numberRoundTo={2}
            defaultUnit="V"
          />
        </SingleInputLine>
      )}
      <SingleInputLine
        label="kV"
        id="kV"
        tooltip="Velocity feedforward gain.  The amount of voltage to apply proportional to the desired velocity."
      >
        <MeasurementOutput
          stateHook={[kV, () => undefined]}
          numberRoundTo={2}
          defaultUnit={distanceType === "angular" ? "V*s/rotation" : "V*s/m"}
        />
      </SingleInputLine>
      {kVAlt !== undefined && (
        <SingleInputLine
          label="kV (angular)"
          id="kVAlt"
          tooltip="Velocity feedforward gain in angular units. Use this for RPM-based velocity control."
        >
          <MeasurementOutput
            stateHook={[kVAlt, () => undefined]}
            numberRoundTo={4}
            defaultUnit="V*s/rotation"
          />
        </SingleInputLine>
      )}
      <SingleInputLine
        label="kA"
        id="kA"
        tooltip="Acceleration feedforward gain.  The amount of voltage to apply proportional to the desired acceleration."
      >
        <MeasurementOutput
          stateHook={[kA, () => undefined]}
          numberRoundTo={2}
          defaultUnit={
            distanceType === "angular" ? "V*s^2/rotation" : "V*s^2/m"
          }
        />
      </SingleInputLine>
      {kAAlt !== undefined && (
        <SingleInputLine
          label="kA (angular)"
          id="kAAlt"
          tooltip="Acceleration feedforward gain in angular units. Use this for RPM-based velocity control."
        >
          <MeasurementOutput
            stateHook={[kAAlt, () => undefined]}
            numberRoundTo={4}
            defaultUnit="V*s^2/rotation"
          />
        </SingleInputLine>
      )}
      <SingleInputLine
        label="System Response Time"
        id="systemResponseTime"
        tooltip="The exponential time constant (τ) of the system, representing the time it takes to reach 1-1/e (~63.2%) of its steady-state velocity after a step change in applied voltage. Lower values indicate faster response."
      >
        <MeasurementOutput
          stateHook={[
            kV.scalar === 0 ? new Measurement(0, "s") : kA.div(kV),
            () => undefined,
          ]}
          numberRoundTo={1}
          defaultUnit="ms"
        />
      </SingleInputLine>
    </div>
  );
};

export default FeedforwardAnalysis;
