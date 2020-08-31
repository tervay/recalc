import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledNumberInput } from "common/components/io/inputs/NumberInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import { makeDataObj, makeLineOptions } from "common/tooling/charts";
import { Motor } from "common/tooling/motors";
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
import React, { useEffect, useState } from "react";

import { RatioDictToNumber } from "../../../common/tooling/io";
import { Line } from "../../../lib/react-chart-js";
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
      motor: MotorParam,
      travelDistance: QtyParam,
      spoolDiameter: QtyParam,
      load: QtyParam,
      ratio: RatioParam,
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
  const [unloadedSpeed, setUnloadedSpeed] = useState(Qty(0, "ft/s"));
  const [loadedSpeed, setLoadedSpeed] = useState(Qty(0, "ft/s"));
  const [timeToGoal, setTimeToGoal] = useState(Qty(0, "s"));
  const [currentDraw, setCurrentDraw] = useState(Qty(0, "A"));
  const [chartData, setChartData] = useState(makeDataObj([]));

  useEffect(() => {
    setUnloadedSpeed(
      CalculateUnloadedSpeed(motor, spoolDiameter, RatioDictToNumber(ratio))
    );

    const loadedSpeed_ = CalculateLoadedSpeed(
      motor,
      spoolDiameter,
      load,
      RatioDictToNumber(ratio),
      efficiency
    );
    setLoadedSpeed(loadedSpeed_);
    setTimeToGoal(CalculateTimeToGoal(travelDistance, loadedSpeed_));

    const timeToGoalChartData = generateTimeToGoalChartData(
      motor,
      travelDistance,
      spoolDiameter,
      load,
      RatioDictToNumber(ratio),
      efficiency
    );

    const currentDrawChartData = generateCurrentDrawChartData(
      motor,
      travelDistance,
      spoolDiameter,
      load,
      RatioDictToNumber(ratio)
    );

    setChartData(makeDataObj([timeToGoalChartData, currentDrawChartData], 2));

    setCurrentDraw(
      calculateCurrentDraw(motor, spoolDiameter, load, RatioDictToNumber(ratio))
    );
  }, [motor, travelDistance, spoolDiameter, load, ratio, efficiency]);

  return (
    <>
      <Heading
        title={linear.title}
        subtitle={`V${linear.version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ motor }, MotorParam),
            new QueryableParamHolder({ travelDistance }, QtyParam),
            new QueryableParamHolder({ spoolDiameter }, QtyParam),
            new QueryableParamHolder({ load }, QtyParam),
            new QueryableParamHolder({ ratio }, RatioParam),
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
          <Line
            data={chartData}
            options={makeLineOptions(
              "Ratio vs Time to Goal",
              "Ratio",
              ["Time (s)", "Current (A)"],
              2
            )}
          />
        </div>
      </div>
    </>
  );
}
