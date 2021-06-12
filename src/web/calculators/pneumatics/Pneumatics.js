import Heading from "common/components/headings/Heading";
import CompressorInput from "common/components/io/inputs/CompressorInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import TabularInput from "common/components/io/inputs/TabularInput";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";
import Metadata from "common/components/Metadata";
import Compressor from "common/models/Compressor";
import Measurement from "common/models/Measurement";
import Piston from "common/models/Piston";
import { Graph } from "common/tooling/graph";
import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { useEffect, useState } from "react";
import { NumberParam } from "use-query-params";

import config from "./index";
import { generatePressureTimeline } from "./math";
import { PneumaticGraphConfig } from "./pneumaticGraphConfig";
import { pneumaticsVersionManager } from "./versions";

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
      p1: Piston.getParam(),
      p2: Piston.getParam(),
      p3: Piston.getParam(),
      volume: Measurement.getParam(),
      compressor: Compressor.getParam(),
    },
    config.initialState,
    pneumaticsVersionManager
  );

  const [p1, setP1] = useState(p1_);
  const [p2, setP2] = useState(p2_);
  const [p3, setP3] = useState(p3_);
  const [volume, setVolume] = useState(volume_);
  const [compressor, setCompressor] = useState(compressor_);

  const [chartData, setChartData] = useState([]);

  const [dutyCycle, setDutyCycle] = useState(0);
  // const [recommendedTanks, setRecommendedTanks] = useState(getRecommendedTanks([p1, p2, p3]))

  useEffect(() => {
    const { timeline: timeline_, dutyCycle: dutyCycle_ } =
      generatePressureTimeline([p1, p2, p3], volume, compressor);
    setChartData(timeline_);

    setDutyCycle(dutyCycle_.toFixed(1));
    // Kinda slow :(
    // setRecommendedTanks(getRecommendedTanks([p1, p2, p3]));
  }, [p1, p2, p3, volume, compressor]);

  return (
    <>
      <Metadata config={config} />
      <div className="columns">
        <div className="column">
          <Heading
            title={config.title}
            subtitle={`V${config.version}`}
            getQuery={() => {
              return stateToQueryString([
                new QueryableParamHolder({ p1 }, Piston.getParam()),
                new QueryableParamHolder({ p2 }, Piston.getParam()),
                new QueryableParamHolder({ p3 }, Piston.getParam()),
                new QueryableParamHolder({ volume }, Measurement.getParam()),
                new QueryableParamHolder({ compressor }, Compressor.getParam()),
                new QueryableParamHolder(
                  { version: config.version },
                  NumberParam
                ),
              ]);
            }}
          />
          <TabularInput
            headers={[
              "",
              "Enabled",
              "Bore",
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
              ["in", "mm", "cm"],
              ["in", "mm", "cm"],
              ["in", "mm", "cm"],
              ["psi"],
              ["psi"],
              ["s"],
            ]}
            labels={["P1", "P2", "P3"]}
            inputKeys={[
              "enabled",
              "bore",
              "rodDiameter",
              "strokeLength",
              "pushPressure",
              "pullPressure",
              "period",
            ]}
          />
          <LabeledQtyInput
            inputId="tankVolume"
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
          <Graph
            options={PneumaticGraphConfig.options()}
            type="line"
            data={{
              datasets: [
                PneumaticGraphConfig.dataset({
                  label: "System Pressure (psi)",
                  data: chartData,
                  colorIndex: 0,
                  id: "y",
                }),
              ],
            }}
          />
        </div>
      </div>
    </>
  );
}
