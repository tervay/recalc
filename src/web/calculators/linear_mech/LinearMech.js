import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledNumberInput } from "common/components/io/inputs/NumberInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import Motor from "common/models/Motor";
import Qty from "common/models/Qty";
import Ratio from "common/models/Ratio";
import { ChartBuilder, YAxisBuilder } from "common/tooling/charts";
import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { setTitle } from "common/tooling/routing";
import { Line } from "lib/react-chart-js";
import React, { useEffect, useState } from "react";
import { NumberParam } from "use-query-params";

import linear from "./index";
import {
  calculateCurrentDraw,
  CalculateLoadedSpeed,
  CalculateTimeToGoal,
  CalculateUnloadedSpeed,
  generateCurrentDrawChartData,
  generateTimeToGoalChartData,
} from "./math";
import { linearVersionManager } from "./versions";

export default function LinearMech() {
  setTitle(linear.title);

  const {
    motor: motor_,
    travelDistance: travelDistance_,
    spoolDiameter: spoolDiameter_,
    load: load_,
    ratio: ratio_,
    efficiency: efficiency_,
  } = queryStringToDefaults(
    window.location.search,
    {
      motor: Motor.getParam(),
      travelDistance: Qty.getParam(),
      spoolDiameter: Qty.getParam(),
      load: Qty.getParam(),
      ratio: Ratio.getParam(),
      efficiency: NumberParam,
    },
    linear.initialState,
    linearVersionManager
  );

  // inputs
  const [motor, setMotor] = useState(motor_);
  const [travelDistance, setTravelDistance] = useState(travelDistance_);
  const [spoolDiameter, setSpoolDiameter] = useState(spoolDiameter_);
  const [load, setLoad] = useState(load_);
  const [ratio, setRatio] = useState(ratio_);
  const [efficiency, setEfficiency] = useState(efficiency_);

  // Outputs
  const [unloadedSpeed, setUnloadedSpeed] = useState(new Qty(0, "ft/s"));
  const [loadedSpeed, setLoadedSpeed] = useState(new Qty(0, "ft/s"));
  const [timeToGoal, setTimeToGoal] = useState(new Qty(0, "s"));
  const [currentDraw, setCurrentDraw] = useState(new Qty(0, "A"));
  const [chartData, setChartData] = useState(ChartBuilder.defaultData());
  const [chartOptions, setChartOptions] = useState(
    ChartBuilder.defaultOptions()
  );

  useEffect(() => {
    setUnloadedSpeed(CalculateUnloadedSpeed(motor, spoolDiameter, ratio));

    const loadedSpeed_ = CalculateLoadedSpeed(
      motor,
      spoolDiameter,
      load,
      ratio,
      efficiency
    );
    setLoadedSpeed(loadedSpeed_);
    setTimeToGoal(CalculateTimeToGoal(travelDistance, loadedSpeed_));

    const timeToGoalChartData = generateTimeToGoalChartData(
      motor,
      travelDistance,
      spoolDiameter,
      load,
      ratio,
      efficiency
    );

    const currentDrawChartData = generateCurrentDrawChartData(
      motor,
      travelDistance,
      spoolDiameter,
      load,
      ratio
    );

    const cb = new ChartBuilder()
      .setXAxisType("linear")
      .setXTitle("Ratio")
      .setTitle("Ratio vs Time to Goal (s) / Current (A)")
      .setLegendEnabled(true)
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("Time (s)")
          .setDisplayAxis(true)
          .setDraw(true)
          .setPosition("left")
          .setData(timeToGoalChartData)
          .setColor(YAxisBuilder.chartColor(0))
      )
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("Current (A)")
          .setDisplayAxis(true)
          .setDraw(false)
          .setPosition("right")
          .setData(currentDrawChartData)
          .setColor(YAxisBuilder.chartColor(1))
      );

    setChartData(cb.buildData());
    setChartOptions(cb.buildOptions());

    setCurrentDraw(calculateCurrentDraw(motor, spoolDiameter, load, ratio));
  }, [motor, travelDistance, spoolDiameter, load, ratio, efficiency]);

  return (
    <>
      <Heading
        title={linear.title}
        subtitle={`V${linear.version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ motor }, Motor.getParam()),
            new QueryableParamHolder({ travelDistance }, Qty.getParam()),
            new QueryableParamHolder({ spoolDiameter }, Qty.getParam()),
            new QueryableParamHolder({ load }, Qty.getParam()),
            new QueryableParamHolder({ ratio }, Ratio.getParam()),
            new QueryableParamHolder({ efficiency }, NumberParam),
            new QueryableParamHolder({ version: linear.version }, NumberParam),
          ]);
        }}
      />

      <div className="columns">
        <div className="column">
          <LabeledMotorInput
            label="Motors"
            stateHook={[motor, setMotor]}
            choices={Motor.choices}
          />
          <LabeledQtyInput
            label="Travel distance"
            stateHook={[travelDistance, setTravelDistance]}
            choices={["in", "ft", "cm", "m"]}
          />
          <LabeledQtyInput
            label="Spool diameter"
            stateHook={[spoolDiameter, setSpoolDiameter]}
            choices={["in", "cm"]}
          />
          <LabeledQtyInput
            label="Load"
            stateHook={[load, setLoad]}
            choices={["lb", "kg", "g"]}
          />
          <LabeledRatioInput label="Ratio" stateHook={[ratio, setRatio]} />
          <LabeledNumberInput
            label="Efficiency (%)"
            stateHook={[efficiency, setEfficiency]}
          />

          <LabeledQtyOutput
            label="Unloaded Speed"
            stateHook={[unloadedSpeed, setUnloadedSpeed]}
            choices={["ft/s", "m/s", "mi/hour", "km/hour"]}
            precision={2}
          />

          <LabeledQtyOutput
            label="Loaded Speed"
            stateHook={[loadedSpeed, setLoadedSpeed]}
            choices={["ft/s", "m/s", "mi/hour", "km/hour"]}
            precision={2}
          />

          <LabeledQtyOutput
            label="Time to goal"
            stateHook={[timeToGoal, setTimeToGoal]}
            choices={["s"]}
            precision={3}
          />
          <LabeledQtyOutput
            label="Current draw"
            stateHook={[currentDraw, setCurrentDraw]}
            choices={["A"]}
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
