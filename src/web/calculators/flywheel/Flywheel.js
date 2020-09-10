import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import {
  ChartBuilder,
  MarkerBuilder,
  YAxisBuilder,
} from "common/tooling/charts";
import {
  MotorParam,
  NumberParam,
  QtyParam,
  QueryableParamHolder,
  queryStringToDefaults,
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
      motor: new Motor(1, "Falcon 500"),
      ratio: new Ratio(1, Ratio.REDUCTION),
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

    const optimalRatioTime = _.minBy(chartData, (o) => o.y);

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

    const reduce = (m) => _.reduce(m, (sum, n) => sum.concat(n.build()), []);

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
          .setData(reduce(currentRatioMarkers))
      )
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("Optimal Ratio")
          .setDisplayAxis(false)
          .setDraw(false)
          .setColor(YAxisBuilder.chartColor(2))
          .setId("Windup Time")
          .setData(reduce(optimalRatioMarkers))
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
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </>
  );
}
