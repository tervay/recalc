import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import {
  ChartBuilder,
  MarkerBuilder,
  YAxisBuilder,
} from "common/tooling/charts";
import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { setTitle } from "common/tooling/routing";
import { Line } from "lib/react-chart-js";
import minBy from "lodash/minBy";
import reduce from "lodash/reduce";
import React, { useEffect, useState } from "react";
import { NumberParam } from "use-query-params";
import {
  calculateWindupTime,
  generateChartData,
} from "web/calculators/flywheel/math";

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
  } = queryStringToDefaults(
    window.location.search,
    {
      motor: Motor.getParam(),
      ratio: Ratio.getParam(),
      radius: Measurement.getParam(),
      targetSpeed: Measurement.getParam(),
      weight: Measurement.getParam(),
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

  // Outputs
  const [windupTime, setWindupTime] = useState(new Measurement(0, "s"));
  const [optimalRatio, setOptimalRatio] = useState(new Ratio(1));

  const [chartData, setChartData] = useState(ChartBuilder.defaultData());
  const [chartOptions, setChartOptions] = useState(
    ChartBuilder.defaultOptions()
  );

  useEffect(() => {
    const newWindupTime = calculateWindupTime(
      weight,
      radius,
      motor.freeSpeed,
      motor.stallTorque,
      motor.stallCurrent,
      motor.resistance,
      motor.quantity,
      ratio,
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
      ratio,
      targetSpeed
    );

    const currentRatioMarkers = [
      new MarkerBuilder()
        .vertical()
        .at(ratio.asNumber())
        .from(0)
        .to(newWindupTime.scalar),
      new MarkerBuilder()
        .horizontal()
        .at(newWindupTime.scalar)
        .from(0)
        .to(ratio.asNumber()),
    ];

    const optimalRatioTime = minBy(chartData, (o) => o.y);
    const optimalRatioMarkers =
      optimalRatioTime !== undefined
        ? [
            new MarkerBuilder()
              .horizontal()
              .at(optimalRatioTime.y)
              .from(0)
              .to(optimalRatioTime.x),
            new MarkerBuilder()
              .vertical()
              .at(optimalRatioTime.x)
              .from(0)
              .to(optimalRatioTime.y),
          ]
        : [];

    const reducer = (m) => reduce(m, (sum, n) => sum.concat(n.build()), []);

    const cb = new ChartBuilder()
      .setXAxisType("linear")
      .setXTitle("Ratio")
      .setLegendEnabled(false)
      .setTitle("Ratio vs Windup Time")
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("Current Ratio")
          .setDisplayAxis(false)
          .setDraw(false)
          .setId("Windup Time")
          .setColor(YAxisBuilder.chartColor(1))
          .setData(reducer(currentRatioMarkers))
      )
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("Optimal Ratio")
          .setDisplayAxis(false)
          .setDraw(false)
          .setColor(YAxisBuilder.chartColor(2))
          .setId("Windup Time")
          .setData(reducer(optimalRatioMarkers))
      )
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("Windup Time (s)")
          .setId("Windup Time")
          .setData(chartData)
          .setColor(YAxisBuilder.chartColor(0))
          .setPosition("left")
      );

    setChartOptions(cb.buildOptions());
    setChartData(cb.buildData());
    if (optimalRatioTime !== undefined) {
      setOptimalRatio(optimalRatioTime.x.toFixed(3));
    }
  }, [motor, ratio, radius, targetSpeed, weight]);

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
          <LabeledRatioInput label="Ratio" inputId="ratio" stateHook={[ratio, setRatio]} />
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
          />
          <LabeledQtyInput
            inputId="weight"
            stateHook={[weight, setWeight]}
            choices={["lb", "kg", "g"]}
            label={"Weight"}
          />
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
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </>
  );
}
