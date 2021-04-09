import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import MultiInputLine from "common/components/io/inputs/MultiInputLine";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import { Graph } from "common/tooling/graph";
import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { setTitle } from "common/tooling/routing";
import React, { useEffect, useState } from "react";
import { BooleanParam, NumberParam } from "use-query-params";
import {
  calculateWindupTime,
  generateChartData,
} from "web/calculators/flywheel/math";

import { FlywheelConfig } from "./flywheelGraph";
import flywheel from "./index";
import { flywheelVersionManager } from "./versions";

export default function Flywheel() {
  setTitle(flywheel.title);

  // Parse URL params
  const {
    motor: motor_,
    ratio: ratio_,
    radius: radius_,
    targetSpeed: targetSpeed_,
    weight: weight_,
    momentOfInertia: momentOfInertia_,
    useCustomMOI: useCustomMOI_,
  } = queryStringToDefaults(
    window.location.search,
    {
      motor: Motor.getParam(),
      ratio: Ratio.getParam(),
      radius: Measurement.getParam(),
      targetSpeed: Measurement.getParam(),
      weight: Measurement.getParam(),
      momentOfInertia: Measurement.getParam(),
      useCustomMOI: BooleanParam,
    },
    flywheel.initialState,
    flywheelVersionManager
  );

  // Inputs
  const [motor, setMotor] = useState(motor_);
  const [ratio, setRatio] = useState(ratio_);
  const [radius, setRadius] = useState(radius_);
  const [targetSpeed, setTargetSpeed] = useState(targetSpeed_);
  const [weight, setWeight] = useState(weight_);
  const [momentOfInertia, setMomentOfInertia] = useState(momentOfInertia_);
  const [useCustomMOI, setUseCustomMOI] = useState(useCustomMOI_);

  // Outputs
  const [windupTime, setWindupTime] = useState(new Measurement(0, "s"));
  const [optimalRatio, setOptimalRatio] = useState(new Ratio(1));

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!useCustomMOI) {
      setMomentOfInertia(weight.mul(radius).mul(radius).mul(0.5));
    }
  }, [useCustomMOI, radius, weight]);

  useEffect(() => {
    const newWindupTime = calculateWindupTime(
      momentOfInertia,
      motor.freeSpeed,
      motor.stallTorque,
      motor.quantity,
      ratio,
      targetSpeed
    );

    setWindupTime(newWindupTime);

    const data = generateChartData(
      momentOfInertia,
      motor.freeSpeed,
      motor.stallTorque,
      motor.quantity,
      ratio,
      targetSpeed
    );

    setChartData(data);
  }, [
    motor,
    ratio,
    radius,
    targetSpeed,
    weight,
    momentOfInertia,
    useCustomMOI,
  ]);

  return (
    <>
      <Heading
        title={flywheel.title}
        subtitle={`V${flywheel.version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ motor }, Motor.getParam()),
            new QueryableParamHolder({ ratio }, Ratio.getParam()),
            new QueryableParamHolder({ radius }, Measurement.getParam()),
            new QueryableParamHolder({ targetSpeed }, Measurement.getParam()),
            new QueryableParamHolder({ weight }, Measurement.getParam()),
            new QueryableParamHolder(
              { momentOfInertia },
              Measurement.getParam()
            ),
            new QueryableParamHolder({ useCustomMOI }, BooleanParam),
            new QueryableParamHolder(
              { version: flywheel.version },
              NumberParam
            ),
          ]);
        }}
      />
      <div className="columns">
        <div className="column">
          <LabeledMotorInput
            inputId="motors"
            label={"Motors"}
            stateHook={[motor, setMotor]}
            choices={Motor.choices}
          />
          <LabeledRatioInput
            label="Ratio"
            inputId="ratio"
            stateHook={[ratio, setRatio]}
          />
          <LabeledQtyInput
            inputId="targetRpm"
            stateHook={[targetSpeed, setTargetSpeed]}
            choices={["rpm"]}
            label={"Target Flywheel Speed"}
            wideLabel={true}
          />
          <LabeledQtyInput
            inputId="radius"
            stateHook={[radius, setRadius]}
            choices={["in", "cm"]}
            label={"Radius"}
            disabled={useCustomMOI}
          />
          <LabeledQtyInput
            inputId="weight"
            stateHook={[weight, setWeight]}
            choices={["lb", "kg", "g"]}
            label={"Weight"}
            disabled={useCustomMOI}
          />

          <MultiInputLine label="MOI">
            <LabeledQtyInput
              inputId="moi"
              stateHook={[momentOfInertia, setMomentOfInertia]}
              choices={["lb in^2", "kg m^2"]}
              label={""}
              disabled={!useCustomMOI}
            />
            <div label="CustomMOI">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={useCustomMOI}
                  onChange={(e) => setUseCustomMOI(e.target.checked)}
                />{" "}
                Use custom MOI
              </label>
            </div>
          </MultiInputLine>

          <LabeledQtyOutput
            inputId="windupTime"
            stateHook={[windupTime, setWindupTime]}
            choices={["s"]}
            label={"Windup Time"}
            precision={3}
          />
          <LabeledNumberOutput
            stateHook={[optimalRatio, setOptimalRatio]}
            label={"Optimal Ratio"}
          />
        </div>
        <div className="column">
          <Graph
            type="line"
            data={{
              labels: ["Lbaels"],
              datasets: [
                FlywheelConfig.dataset({
                  data: chartData,
                  label: "Data",
                  colorIndex: 0,
                  id: "y",
                }),
              ],
            }}
            options={FlywheelConfig.options()}
          />
        </div>
      </div>
    </>
  );
}
