import Graph from "common/components/graphing/Graph";
import { EzDataset, GraphConfig } from "common/components/graphing/graphConfig";
import Compressor from "common/models/Compressor";
import Measurement from "common/models/Measurement";
import { useMemo } from "react";
import { graphConfig } from "web/info/compressors";

export default function CompressorsPage(): JSX.Element {
  const data: EzDataset[] = useMemo(
    () =>
      Compressor.getAllCompressors().map((c, i) =>
        GraphConfig.dataset(
          c.identifier,
          [...Array(120).keys()].map((n) => ({
            x: n,
            y: c.cfmAtPressure(new Measurement(n, "psi")).scalar,
          })),
          i,
          `y-${c.identifier}`
        )
      ),
    []
  );

  console.log(data);

  return (
    <>
      <div className="playground-container">
        <Graph
          options={graphConfig}
          data={{ datasets: data }}
          type="line"
          title="Compressor Data"
          id="compressorGraph"
        />
      </div>
    </>
  );
}
