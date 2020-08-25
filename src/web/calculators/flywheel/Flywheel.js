import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import {
  horizontalMarker,
  makeDataObj,
  makeLineOptions,
  verticalMarker,
} from "common/tooling/charts";
import { RatioDictToNumber } from "common/tooling/io";
import { Motor } from "common/tooling/motors";
import {
  MotorParam,
  NumberParam,
  QtyParam,
  QueryableParamHolder,
  queryStringToDefaults,
  RATIO_REDUCTION,
  RatioParam,
  stateToQueryString,
} from "common/tooling/query-strings";
import { setTitle } from "common/tooling/routing";
import Qty from "js-quantities";
import { Line } from "lib/react-chart-js";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import {
  calculateWindupTime,
  generateChartData,
} from "web/calculators/flywheel/math";

import { TITLE as title, VERSION as version } from "./config";
import { flywheelVersionManager } from "./versions";

export default function Flywheel() {
  setTitle(title);

  // Parse URL params
  const {
    motor: motor_,
    ratio: ratio_,
    radius: radius_,
    targetSpeed: targetSpeed_,
    weight: weight_,
  } = queryStringToDefaults(
    window.location.search,
    {
      motor: MotorParam,
      ratio: RatioParam,
      radius: QtyParam,
      targetSpeed: QtyParam,
      weight: QtyParam,
    },
    {
      motor: Motor.of(1, "Falcon 500"),
      ratio: {
        amount: 1,
        type: RATIO_REDUCTION,
      },
      radius: Qty(2, "in"),
      targetSpeed: Qty(2000, "rpm"),
      weight: Qty(5, "lb"),
    },
    flywheelVersionManager
  );

  // Inputs
  const [motor, setMotor] = useState(motor_);
  const [ratio, setRatio] = useState(ratio_);
  const [radius, setRadius] = useState(radius_);
  const [targetSpeed, setTargetSpeed] = useState(targetSpeed_);
  const [weight, setWeight] = useState(weight_);

  // Outputs
  const [windupTime, setWindupTime] = useState(Qty(0, "s"));
  const [chartData, setChartData] = useState(makeDataObj([]));

  useEffect(() => {
    const newWindupTime = calculateWindupTime(
      weight,
      radius,
      motor.freeSpeed,
      motor.stallTorque,
      motor.stallCurrent,
      motor.resistance,
      motor.quantity,
      RatioDictToNumber(ratio),
      targetSpeed
    );

    setWindupTime(newWindupTime);

    const chartData = generateChartData(
      weight,
      radius,
      motor.freeSpeed,
      motor.stallTorque,
      motor.stallCurrent,
      motor.resistance,
      motor.quantity,
      RatioDictToNumber(ratio),
      targetSpeed
    );

    const currentRatioMarkers = horizontalMarker(
      newWindupTime.to("s").scalar,
      0,
      RatioDictToNumber(ratio)
    ).concat(
      verticalMarker(RatioDictToNumber(ratio), 0, newWindupTime.to("s").scalar)
    );

    const optimalRatioTime = _.minBy(chartData, (o) => o.y);
    const optimalRatioMarkers = horizontalMarker(
      optimalRatioTime.y,
      0,
      optimalRatioTime.x
    ).concat(verticalMarker(optimalRatioTime.x, 0, optimalRatioTime.y));

    setChartData(
      makeDataObj([chartData, currentRatioMarkers, optimalRatioMarkers])
    );
  }, [motor, ratio, radius, targetSpeed, weight]);

  return (
    <>
      <Heading
        title={title}
        subtitle={`V${version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ motor }, MotorParam),
            new QueryableParamHolder({ ratio }, RatioParam),
            new QueryableParamHolder({ radius }, QtyParam),
            new QueryableParamHolder({ targetSpeed }, QtyParam),
            new QueryableParamHolder({ weight }, QtyParam),
            new QueryableParamHolder({ version }, NumberParam),
          ]);
        }}
      />
      <div className="columns">
        <div className="column">
          <LabeledMotorInput
            label={"Motors"}
            stateHook={[motor, setMotor]}
            choices={Motor.choices}
          />
          <LabeledRatioInput label="Ratio" stateHook={[ratio, setRatio]} />
          <LabeledQtyInput
            stateHook={[targetSpeed, setTargetSpeed]}
            choices={["rpm"]}
            label={"Target Flywheel Speed"}
            wideLabel={true}
          />
          <LabeledQtyInput
            stateHook={[radius, setRadius]}
            choices={["in", "cm"]}
            label={"Radius"}
          />
          <LabeledQtyInput
            stateHook={[weight, setWeight]}
            choices={["lb", "kg", "g"]}
            label={"Weight"}
          />
          <LabeledQtyOutput
            stateHook={[windupTime, setWindupTime]}
            choices={["s"]}
            label={"Windup Time"}
            precision={3}
          />
        </div>
        <div className="column">
          <Line
            data={chartData}
            options={makeLineOptions(
              "Ratio vs Windup Time",
              "Ratio",
              "Time (s)"
            )}
          />
        </div>
      </div>
    </>
  );
}
