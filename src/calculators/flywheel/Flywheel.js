import {
  calculateWindupTime,
  generateChartData,
} from "calculators/flywheel/math";
import Heading from "common/components/calc-heading/Heading";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import { LabeledNumberInput } from "common/components/io/inputs/NumberInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import { makeDataObj, makeLineOptions } from "common/tooling/charts";
import { motorMap } from "common/tooling/motors";
import {
  MotorParam,
  NumberParam,
  QtyParam,
  QueryableParamHolder,
  stateToQueryString,
} from "common/tooling/query-strings";
import Qty from "js-quantities";
import { Line } from "lib/react-chart-js";
import React, { useEffect, useState } from "react";

export default function Flywheel(props) {
  // Inputs
  const [motor, setMotor] = useState({
    quantity: 1,
    data: motorMap["Falcon 500"],
  });
  const [ratio, setRatio] = useState(1);
  const [radius, setRadius] = useState(Qty(2, "in"));
  const [targetSpeed, setTargetSpeed] = useState(Qty(2000, "rpm"));
  const [weight, setWeight] = useState(Qty(5, "lb"));

  // Outputs
  const [windupTime, setWindupTime] = useState(Qty(0, "s"));
  const [chartData, setChartData] = useState(makeDataObj([]));

  useEffect(() => {
    console.log(motor);
    setWindupTime(
      calculateWindupTime(
        weight,
        radius,
        motor.data.freeSpeed,
        motor.data.stallTorque,
        motor.data.stallCurrent,
        motor.data.resistance,
        motor.quantity,
        ratio,
        targetSpeed
      )
    );

    setChartData(
      makeDataObj([
        generateChartData(
          weight,
          radius,
          motor.data.freeSpeed,
          motor.data.stallTorque,
          motor.data.stallCurrent,
          motor.data.resistance,
          motor.quantity,
          ratio,
          targetSpeed
        ),
      ])
    );
  }, [motor, ratio, radius, targetSpeed, weight]);

  return (
    <>
      <Heading
        title="Flywheel calculator"
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ motor }, MotorParam),
            new QueryableParamHolder({ ratio }, NumberParam),
            new QueryableParamHolder({ radius }, QtyParam),
            new QueryableParamHolder({ targetSpeed }, QtyParam),
            new QueryableParamHolder({ weight }, QtyParam),
          ]);
        }}
      />
      <div className="columns">
        <div className="column">
          <LabeledMotorInput
            label={"Motors"}
            stateHook={[motor, setMotor]}
            choices={Object.keys(motorMap)}
          />
          <LabeledNumberInput stateHook={[ratio, setRatio]} label="Ratio" />
          <LabeledQtyInput
            stateHook={[targetSpeed, setTargetSpeed]}
            choices={["rpm"]}
            label={"Target Speed"}
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
