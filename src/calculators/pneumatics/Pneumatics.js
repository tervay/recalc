import Heading from "common/components/calc-heading/Heading";
import CompressorInput from "common/components/io/inputs/CompressorInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import TabularInput from "common/components/io/inputs/TabularInput";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";
import { makeDataObj, makeLineOptions } from "common/tooling/charts";
import { compressorMap } from "common/tooling/compressors";
import {
  CompressorParam,
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
  const {
    p1: p1_,
    p2: p2_,
    p3: p3_,
    volume: volume_,
    compressor: compressor_,
  } = queryStringToDefaults(
    window.location.search,
    {
      p1: PistonParam,
      p2: PistonParam,
      p3: PistonParam,
      volume: QtyParam,
      compressor: CompressorParam,
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
      compressor: compressorMap["VIAIR 90C"],
    }
  );

  const [p1, setP1] = useState(p1_);
  const [p2, setP2] = useState(p2_);
  const [p3, setP3] = useState(p3_);
  const [volume, setVolume] = useState(volume_);
  const [compressor, setCompressor] = useState(compressor_);

  const [graphData, setGraphData] = useState(makeDataObj([]));
  const [dutyCycle, setDutyCycle] = useState(0);
  // const [recommendedTanks, setRecommendedTanks] = useState(getRecommendedTanks([p1, p2, p3]))

  useEffect(() => {
    const {
      timeline: timeline_,
      dutyCycle: dutyCycle_,
    } = generatePressureTimeline([p1, p2, p3], volume, compressor);
    setGraphData(makeDataObj([timeline_]));
    setDutyCycle(dutyCycle_.toFixed(1));

    // setGraphData(makeDataObj([generatePressureTimeline([p1, p2, p3], volume)]));

    // Kinda slow :(
    // setRecommendedTanks(getRecommendedTanks([p1, p2, p3]));
  }, [p1, p2, p3, volume, compressor]);

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
                new QueryableParamHolder({ volume }, QtyParam),
                new QueryableParamHolder({ compressor }, CompressorParam),
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
              [
                "Actuation Period",
                "An actuation is considered to be both a push and a pull",
              ],
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
            abbr={"KOP tank volume is 590 mL"}
          />
          <CompressorInput stateHook={[compressor, setCompressor]} />
          <LabeledNumberOutput
            label={"Compressor Duty Cycle"}
            stateHook={[dutyCycle, setDutyCycle]}
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
