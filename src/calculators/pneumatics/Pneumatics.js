import Heading from "common/components/calc-heading/Heading";
import TabularInput from "common/components/io/inputs/TabularInput";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";
import {
  PistonParam,
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import Qty from "js-quantities";
import React, { useEffect, useState } from "react";
import { generatePressureTimeline } from "./math";
import { makeDataObj, makeLineOptions } from "common/tooling/charts";
import { Line } from "lib/react-chart-js";

export default function Pneumatics() {
  const { p1: p1_, p2: p2_, p3: p3_ } = queryStringToDefaults(
    window.location.search,
    {
      p1: PistonParam,
      p2: PistonParam,
      p3: PistonParam,
    },
    {
      p1: {
        enabled: true,
        diameter: Qty(1.5, "in"),
        rodDiameter: Qty(0.375, "in"),
        strokeLength: Qty(12, "in"),
        pushPressure: Qty(40, "psi"),
        pullPressure: Qty(15, "psi"),
        period: Qty(1, "s"),
      },
      p2: {
        enabled: true,
        diameter: Qty(1.5, "in"),
        rodDiameter: Qty(0.375, "in"),
        strokeLength: Qty(12, "in"),
        pushPressure: Qty(40, "psi"),
        pullPressure: Qty(15, "psi"),
        period: Qty(1, "s"),
      },
      p3: {
        enabled: true,
        diameter: Qty(1.5, "in"),
        rodDiameter: Qty(0.375, "in"),
        strokeLength: Qty(12, "in"),
        pushPressure: Qty(40, "psi"),
        pullPressure: Qty(15, "psi"),
        period: Qty(1, "s"),
      },
    }
  );

  const [p1, setP1] = useState(p1_);
  const [p2, setP2] = useState(p2_);
  const [p3, setP3] = useState(p3_);

  const [graphData, setGraphData] = useState(makeDataObj([]));

  useEffect(() => {
    console.log("update");
    setGraphData(
      makeDataObj([generatePressureTimeline([p1, p2, p3], Qty(600, "ml"))])
    );
  }, [p1, p2, p3]);

  return (
    <>
      <div className="columns">
        <div className="column">
          <Heading
            title="Pneumatics calculator"
            getQuery={() => {
              return stateToQueryString([
                new QueryableParamHolder({ p1 }, PistonParam),
                new QueryableParamHolder({ p2 }, PistonParam),
                new QueryableParamHolder({ p3 }, PistonParam),
              ]);
            }}
          />
          <TabularInput
            headers={[
              "",
              "Enabled",
              "Diameter",
              "Rod Diameter",
              "Stroke Length",
              "Push Pressure",
              "Pull Pressure",
              "Actuation Period",
            ]}
            inputs={[
              [p1, setP1],
              [p2, setP2],
              [p3, setP3],
            ]}
            choices={[
              [],
              ["in", "cm"],
              ["in", "cm"],
              ["in", "cm"],
              ["psi"],
              ["psi"],
              ["s"],
            ]}
            labels={["P1", "P2", "P3"]}
          />
          <Line
            data={graphData}
            options={makeLineOptions(
              "Ratio vs Windup Time",
              "Ratio",
              "Time (s)",
              true
            )}
          />
        </div>
      </div>
    </>
  );
}
