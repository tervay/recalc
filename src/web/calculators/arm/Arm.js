import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { setTitle } from "common/tooling/routing";
import { defaultAssignment } from "common/tooling/versions";
import React, { useEffect, useState } from "react";
import { NumberParam } from "use-query-params";

import arm from "./index";
import { calculateTimeToGoalJVN } from "./math";

export default function Arm() {
  setTitle(arm.title);

  // Parse URL params
  const {
    motor: motor_,
    ratio: ratio_,
    armLength: armLength_,
    armLoad: armLoad_,
    angleChange: angleChange_,
  } = queryStringToDefaults(
    window.location.search,
    {
      motor: Motor.getParam(),
      ratio: Ratio.getParam(),
      armLength: Measurement.getParam(),
      armLoad: Measurement.getParam(),
      angleChange: Measurement.getParam(),
    },
    arm.initialState,
    defaultAssignment
  );

  // Inputs
  const [motor, setMotor] = useState(motor_);
  const [ratio, setRatio] = useState(ratio_);
  const [armLength, setArmLength] = useState(armLength_);
  const [armLoad, setArmLoad] = useState(armLoad_);
  const [angleChange, setAngleChange] = useState(angleChange_);

  // Outputs
  const [timeToGoal, setTimeToGoal] = useState(new Measurement(0, "s"));

  useEffect(() => {
    setTimeToGoal(
      calculateTimeToGoalJVN(motor, ratio, armLength, armLoad, angleChange)
    );
  }, [motor, ratio, armLength, armLoad, angleChange]);

  return (
    <>
      <Heading
        title={arm.title}
        subtitle={`V${arm.version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ version: arm.version }, NumberParam),
            new QueryableParamHolder({ motor }, Motor.getParam()),
            new QueryableParamHolder({ ratio }, Ratio.getParam()),
            new QueryableParamHolder({ armLength }, Measurement.getParam()),
            new QueryableParamHolder({ armLoad }, Measurement.getParam()),
          ]);
        }}
      />
      <div className="columns">
        <div className="column is-half">
          <LabeledMotorInput
            stateHook={[motor, setMotor]}
            label={"Motor"}
            choices={Motor.getAllMotors().map((m) => m.name)}
          />
          <LabeledRatioInput stateHook={[ratio, setRatio]} label={"Ratio"} />
          <LabeledQtyInput
            stateHook={[armLength, setArmLength]}
            label={"Arm Length"}
            choices={["in", "ft", "cm", "m"]}
          />
          <LabeledQtyInput
            stateHook={[armLoad, setArmLoad]}
            label={"Arm Load"}
            choices={["lbf"]}
          />
          <LabeledQtyInput
            stateHook={[angleChange, setAngleChange]}
            label={"Angle Change"}
            choices={["deg"]}
          />
          <LabeledQtyOutput
            stateHook={[timeToGoal, setTimeToGoal]}
            label={"Time to goal"}
            choices={["s"]}
            precision={3}
          />
        </div>
        <div className="column">
          <article className="message is-warning">
            <div className="message-header">
              <p>Note</p>
            </div>
            <div className="message-body">
              This arm calculator currently does not account for gravity pulling
              down on the arm.
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
