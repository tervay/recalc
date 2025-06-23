import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import MeasurementInputOutput from "common/components/io/new/inputs/L3/MeasurementInputOutput";
import Measurement from "common/models/Measurement";
import React, { useState } from "react";
import { Message } from "../../../../common/components/styling/Building";

type ToleranceType = "position" | "velocity";

interface CostFunctionControlsProps {
  maxEffort: Measurement;
  setMaxEffort: React.Dispatch<React.SetStateAction<Measurement>>;
  posTolerance?: Measurement;
  setPosTolerance?: React.Dispatch<React.SetStateAction<Measurement>>;
  velTolerance?: Measurement;
  setVelTolerance?: React.Dispatch<React.SetStateAction<Measurement>>;
  distanceUnit?: string;
  velocityUnit?: string;
  toleranceType: ToleranceType;
}

const CostFunctionControls: React.FC<CostFunctionControlsProps> = ({
  maxEffort,
  setMaxEffort,
  posTolerance,
  setPosTolerance,
  velTolerance,
  setVelTolerance,
  distanceUnit,
  velocityUnit,
  toleranceType,
}) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div>
      <button
        className="cost-function-controls-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        Cost Function Controls {collapsed ? "(Show)" : "(Hide)"}
      </button>
      {!collapsed && (
        <div className="cost-function-controls">
          <Message color="warning">
            These inputs control the weighting of the cost function used to
            define "optimality" for the feedback gain calculation. By default,
            they are seeded with values inferred from the physical
            specifications of your mechanism and from your measurement delay
            setting. The default tolerances - especially the velocity tolerance
            - err on the side of passive/conservative response, and can often be
            lowered for more aggressive/accurate tracking. If tightening a
            tolerance causes the corresponding gain to shrink rather than
            increase, this means your mechanism is too fast relative to the
            measurement delay for aggressive control. You can either loosen the
            tolerances and accept the performance loss, or reduce the
            measurement delay.
          </Message>
          <SingleInputLine
            label="Max Effort"
            id="maxEffort"
            tooltip="Inverse square cost function weight for control effort (applied voltage).  A higher value will make the controller more aggressive.  Typically you will not need to change this, because FRC robots all operate at ~12V."
          >
            <MeasurementInputOutput
              stateHook={[maxEffort, setMaxEffort]}
              defaultUnit="V"
              step={1}
            />
          </SingleInputLine>
          {toleranceType === "position" &&
            posTolerance &&
            setPosTolerance &&
            distanceUnit && (
              <SingleInputLine
                label="Position Tolerance"
                id="posTolerance"
                tooltip="Inverse square cost function weight for position error.  A lower value will make the controller more aggressive.  Set this to the acceptable operational error for your mechanism."
              >
                <MeasurementInputOutput
                  stateHook={[posTolerance, setPosTolerance]}
                  defaultUnit={distanceUnit}
                  numberRoundTo={2}
                  step={0.1}
                />
              </SingleInputLine>
            )}
          {(toleranceType === "velocity" || toleranceType === "position") &&
            velTolerance &&
            setVelTolerance &&
            velocityUnit && (
              <SingleInputLine
                label="Velocity Tolerance"
                id="velTolerance"
                tooltip="Inverse square cost function weight for velocity error.  A lower value will make the controller more aggressive.  Set this to the acceptable operational error for your mechanism."
              >
                <MeasurementInputOutput
                  stateHook={[velTolerance, setVelTolerance]}
                  defaultUnit={velocityUnit}
                  numberRoundTo={2}
                  step={0.1}
                  numberDelay={500}
                />
              </SingleInputLine>
            )}
        </div>
      )}
    </div>
  );
};

export default CostFunctionControls;
