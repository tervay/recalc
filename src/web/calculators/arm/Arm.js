import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledPatientNumberInput } from "common/components/io/inputs/PatientNumberInput";
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
import worker from "workerize-loader!./math"; // eslint-disable-line import/no-webpack-loader-syntax

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
  // const [debug, setDebug] = useState("");

  useEffect(() => {
    // // setDebug(
    // //   states
    // //     .map(
    // //       (s) =>
    // //         `${s.t.format()}\n${s.p.format("deg")}\n${s.v.format(
    // //           "rpm"
    // //         )}\n${s.a.format(
    // //           "rpm/s"
    // //         )}\ngrav: ${s.gt.format()}\ngb: ${s.gb.format()}\n${s.c.format()}`
    // //     )
    // //     .join("\n-----------\n")
    // // );

    instance
      .calculateState(
        motor.toDict(),
        ratio.toDict(),
        comLength.toDict(),
        armMass.toDict(),
        startAngle.toDict(),
        endAngle.toDict(),
        iterationLimit
      )
      .then((result) => {
        setTimeToGoal(Measurement.fromDict(result[result.length - 1].t));
      });
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
          />
        </div>
        <div className="column">
          <article className="message is-danger">
            <div className="message-header">
              <p>Note</p>
            </div>
            <div className="message-body">
              Performance is a bit slow. Expect fixes soon. <br />
            </div>
          </article>
          <article className="message is-info">
            <div className="message-header">
              <p>Note</p>
            </div>
            <div className="message-body">
              The angles follow the unit circle; i.e.: <br />
              Upright = 90° <br />
              Parallel to ground = 0° (right) or 180° (left)
              <br />
              <br />
              For the time being, this is only accurate for arms moving against
              gravity and starting angle is less than ending angle.
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
