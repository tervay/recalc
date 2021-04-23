import Heading from "common/components/headings/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledPatientNumberInput } from "common/components/io/inputs/PatientNumberInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import Metadata from "common/components/Metadata";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import { Graph } from "common/tooling/graph";
import { cleanAngleInput } from "common/tooling/math";
import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { objectify, unobjectify } from "common/tooling/util";
import { defaultAssignment } from "common/tooling/versions";
import { useEffect, useState } from "react";
import { NumberParam } from "use-query-params";
import worker from "workerize-loader!web/calculators/arm/math";

import { ArmGraphConfig } from "./ArmGraphConfig";
import config from "./index";
import { buildDataForAccessorVsTime } from "./math";

let instance = worker();

export default function Arm() {
  const {
    motor: motor_,
    ratio: ratio_,
    comLength: comLength_,
    armMass: armMass_,
    currentLimit: currentLimit_,
    startAngle: startAngle_,
    endAngle: endAngle_,
    iterationLimit: iterationLimit_,
  } = queryStringToDefaults(
    window.location.search,
    {
      motor: Motor.getParam(),
      ratio: Ratio.getParam(),
      comLength: Measurement.getParam(),
      armMass: Measurement.getParam(),
      currentLimit: Measurement.getParam(),
      startAngle: Measurement.getParam(),
      endAngle: Measurement.getParam(),
      iterationLimit: NumberParam,
    },
    config.initialState,
    defaultAssignment
  );

  // Inputs
  const [motor, setMotor] = useState(motor_);
  const [ratio, setRatio] = useState(ratio_);
  const [comLength, setComLength] = useState(comLength_);
  const [armMass, setArmMass] = useState(armMass_);
  const [currentLimit, setCurrentLimit] = useState(currentLimit_);
  const [startAngle, setStartAngle] = useState(startAngle_);
  const [endAngle, setEndAngle] = useState(endAngle_.round(10));
  const [iterationLimit, setIterationLimit] = useState(iterationLimit_);

  // Outputs
  const [timeToGoal, setTimeToGoal] = useState(new Measurement(0, "s"));
  const [timeIsCalculating, setTimeIsCalculating] = useState(true);

  const [rawChartData, setRawChartData] = useState([]);

  useEffect(() => {
    instance
      .calculateState(
        objectify({
          motor,
          ratio,
          comLength,
          armMass,
          currentLimit,
          startAngle: cleanAngleInput(startAngle),
          endAngle: cleanAngleInput(endAngle),
          iterationLimit,
        })
      )
      .then((result) => {
        result = result.map((r) => unobjectify(r));
        setTimeIsCalculating(false);

        if (result.length > 0) {
          setTimeToGoal(result[result.length - 1].time);
        } else {
          setTimeToGoal(new Measurement(0, "s"));
        }

        setRawChartData(
          buildDataForAccessorVsTime(result, (s) => s.current.scalar, false)
        );
      });

    setTimeIsCalculating(true);
  }, [
    motor,
    ratio,
    comLength,
    armMass,
    currentLimit,
    startAngle,
    endAngle,
    iterationLimit,
  ]);

  return (
    <>
      <Metadata config={config} />
      <Heading
        title={config.title}
        subtitle={`V${config.version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ version: config.version }, NumberParam),
            new QueryableParamHolder({ motor }, Motor.getParam()),
            new QueryableParamHolder({ ratio }, Ratio.getParam()),
            new QueryableParamHolder({ comLength }, Measurement.getParam()),
            new QueryableParamHolder({ armMass }, Measurement.getParam()),
            new QueryableParamHolder({ currentLimit }, Measurement.getParam()),
            new QueryableParamHolder({ startAngle }, Measurement.getParam()),
            new QueryableParamHolder({ endAngle }, Measurement.getParam()),
            new QueryableParamHolder({ iterationLimit }, NumberParam),
          ]);
        }}
      />
      <div className="columns">
        <div className="column is-half">
          <LabeledMotorInput
            inputId="motors"
            stateHook={[motor, setMotor]}
            label={"Motor"}
            choices={Motor.getAllMotors().map((m) => m.name)}
          />
          <LabeledRatioInput
            inputId="ratio"
            stateHook={[ratio, setRatio]}
            label={"Ratio"}
          />
          <LabeledQtyInput
            inputId="comLength"
            stateHook={[comLength, setComLength]}
            label={"CoM Distance"}
            choices={["in", "ft", "cm", "m"]}
          />
          <LabeledQtyInput
            inputId="weight"
            stateHook={[armMass, setArmMass]}
            label={"Arm Mass"}
            choices={["lb", "kg"]}
          />
          <LabeledQtyInput
            stateHook={[currentLimit, setCurrentLimit]}
            inputId="currentLimit"
            label="Current Limit"
            choices={["A"]}
          />
          <LabeledQtyInput
            inputId="startAngle"
            stateHook={[startAngle, setStartAngle]}
            label={"Start Angle"}
            choices={["deg", "rad"]}
          />{" "}
          <LabeledQtyInput
            inputId="endAngle"
            stateHook={[endAngle, setEndAngle]}
            label={"End Angle"}
            choices={["deg", "rad"]}
          />
          <LabeledPatientNumberInput
            inputId="iterationLimit"
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
              <br />
              <br />
              This accounts for acceleration, but not deceleration.
            </div>
          </article>
          <Graph
            type="line"
            options={ArmGraphConfig.options()}
            data={{
              datasets: [
                ArmGraphConfig.dataset({
                  label: "Current Draw (A)",
                  colorIndex: 0,
                  data: rawChartData,
                  id: "y",
                }),
              ],
            }}
          />
        </div>
      </div>
    </>
  );
}
