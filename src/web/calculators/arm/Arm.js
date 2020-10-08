import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledPatientNumberInput } from "common/components/io/inputs/PatientNumberInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import { cleanAngleInput } from "common/tooling/math";
import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { setTitle } from "common/tooling/routing";
import { sendToWorker } from "common/tooling/util";
import { defaultAssignment } from "common/tooling/versions";
import React, { useEffect, useState } from "react";
import { NumberParam } from "use-query-params";
/* eslint import/no-webpack-loader-syntax: off */
import worker from "workerize-loader!./math";

import arm from "./index";

let instance = worker();

export default function Arm() {
  setTitle(arm.title);

  // Parse URL params
  const {
    motor: motor_,
    ratio: ratio_,
    comLength: comLength_,
    armMass: armMass_,
    startAngle: startAngle_,
    endAngle: endAngle_,
    iterationLimit: iterationLimit_,
  } = queryStringToDefaults(
    window.location.search,
    {
      motor: Motor.getParam(),
      ratio: Ratio.getParam(),
      armLength: Measurement.getParam(),
      armMass: Measurement.getParam(),
      startAngle: Measurement.getParam(),
      endAngle: Measurement.getParam(),
      iterationLimit: NumberParam,
    },
    arm.initialState,
    defaultAssignment
  );

  // Inputs
  const [motor, setMotor] = useState(motor_);
  const [ratio, setRatio] = useState(ratio_);
  const [comLength, setComLength] = useState(comLength_);
  const [armMass, setArmMass] = useState(armMass_);
  const [startAngle, setStartAngle] = useState(startAngle_);
  const [endAngle, setEndAngle] = useState(endAngle_);
  const [iterationLimit, setIterationLimit] = useState(iterationLimit_);

  // Outputs
  const [timeToGoal, setTimeToGoal] = useState(new Measurement(0, "s"));
  const [timeIsCalculating, setTimeIsCalculating] = useState(true);
  // const [debug, setDebug] = useState("");

  useEffect(() => {
    instance
      .calculateState(
        sendToWorker({
          motor,
          ratio,
          comLength,
          armMass,
          startAngle: cleanAngleInput(startAngle),
          endAngle: cleanAngleInput(endAngle),
          iterationLimit,
        })
      )
      .then((result) => {
        setTimeToGoal(Measurement.fromDict(result[result.length - 1].t));
        setTimeIsCalculating(false);
      });

    setTimeIsCalculating(true);
  }, [motor, ratio, comLength, armMass, startAngle, endAngle, iterationLimit]);

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
            new QueryableParamHolder(
              { armLength: comLength },
              Measurement.getParam()
            ),
            new QueryableParamHolder({ armMass }, Measurement.getParam()),
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
            stateHook={[comLength, setComLength]}
            label={"CoM Distance"}
            choices={["in", "ft", "cm", "m"]}
          />
          <LabeledQtyInput
            stateHook={[armMass, setArmMass]}
            label={"Arm Mass"}
            choices={["lb", "kg"]}
          />
          <LabeledQtyInput
            stateHook={[startAngle, setStartAngle]}
            label={"Start Angle"}
            choices={["deg", "rad"]}
          />{" "}
          <LabeledQtyInput
            stateHook={[endAngle, setEndAngle]}
            label={"End Angle"}
            choices={["deg", "rad"]}
          />
          <LabeledPatientNumberInput
            stateHook={[iterationLimit, setIterationLimit]}
            label={"Iteration Limit"}
            delay={0.4}
          />
          <LabeledQtyOutput
            stateHook={[timeToGoal, setTimeToGoal]}
            label={"Time to goal"}
            choices={["s"]}
            precision={3}
            isLoading={timeIsCalculating}
          />
        </div>
        <div className="column">
          <article className="message is-info">
            <div className="message-header">
              <p>Note</p>
            </div>
            <div className="message-body">
              The angles follow the unit circle; i.e.: <br />
              Upright = 90° <br />
              Parallel to ground = 0° (right) or 180° (left) <br />
              Downwards = -90° or 270°
              <br />
              <br />
              For example: <br />
              3/4 of a full rotation: start angle of 0°, end angle of 270°.
              <br />
              1/4 of a rotation downwards: start angle of 60°, end angle of
              -30°.
              <br />
              <br />
              If you get a result of 0s for time to goal, try increasing
              iteration limit.
            </div>
          </article>
          {/*<pre>{debug}</pre>*/}
        </div>
      </div>
    </>
  );
}
