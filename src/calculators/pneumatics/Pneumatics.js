import Heading from "common/components/calc-heading/Heading";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import TabularInput from "common/components/io/inputs/TabularInput";
import { makeDataObj, makeLineOptions } from "common/tooling/charts";
import {
  PistonParam,
  QtyParam,
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import Qty from "js-quantities";
import { Line } from "lib/react-chart-js";
import React, { useEffect, useState } from "react";
import { generatePressureTimeline } from "./math";

export default function Pneumatics() {
  const { p1: p1_, p2: p2_, p3: p3_, volume: volume_ } = queryStringToDefaults(
    window.location.search,
    {
      p1: PistonParam,
      p2: PistonParam,
      p3: PistonParam,
      volume: QtyParam,
    },
    {
      p1: {
        enabled: true,
        diameter: Qty(1.5, "in"),
        rodDiameter: Qty(0.375, "in"),
        strokeLength: Qty(12, "in"),
        pushPressure: Qty(40, "psi"),
        pullPressure: Qty(15, "psi"),
        period: Qty(10, "s"),
      },
      p2: {
        enabled: false,
        diameter: Qty(1.5, "in"),
        rodDiameter: Qty(0.375, "in"),
        strokeLength: Qty(12, "in"),
        pushPressure: Qty(40, "psi"),
        pullPressure: Qty(15, "psi"),
        period: Qty(8, "s"),
      },
      p3: {
        enabled: false,
        diameter: Qty(1.5, "in"),
        rodDiameter: Qty(0.375, "in"),
        strokeLength: Qty(12, "in"),
        pushPressure: Qty(40, "psi"),
        pullPressure: Qty(15, "psi"),
        period: Qty(5, "s"),
      },
      volume: Qty(1200, "ml"),
    }
  );

  const [p1, setP1] = useState(p1_);
  const [p2, setP2] = useState(p2_);
  const [p3, setP3] = useState(p3_);
  const [volume, setVolume] = useState(volume_);

  const [graphData, setGraphData] = useState(makeDataObj([]));

  useEffect(() => {
    console.log("update");
    setGraphData(makeDataObj([generatePressureTimeline([p1, p2, p3], volume)]));
  }, [p1, p2, p3, volume]);

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
                new QueryableParamHolder({ volume }, QtyParam)
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
          <LabeledQtyInput
            stateHook={[volume, setVolume]}
            choices={["ml", "in^3"]}
            label={"Tank Volume"}
          />
          <Line
            data={graphData}
            options={makeLineOptions(
              "System Pressure Over Time",
              "Time (s)",
              "Pressure (PSI)",
              true
            )}
          />
        </div>
      </div>
    </>
  );
}
