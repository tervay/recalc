import Graph from "common/components/graphing/Graph";
import { EzDataset } from "common/components/graphing/types";
import { StateMaker, useGettersSetters } from "common/tooling/conversion";
import { useEffect, useState } from "react";
import { useMotorPlaygroundWorker } from "web/calculators/workers";
import {
  graphConfig,
  MotorPlaygroundParams,
  MotorPlaygroundState,
} from "web/info/motors";
import PlaygroundInput from "web/info/motors/components/PlaygroundInput";

export default function Playground(): JSX.Element {
  const [get, set] = useGettersSetters(
    StateMaker.BumpState(1, [MotorPlaygroundParams], []) as MotorPlaygroundState
  );
  const worker = useMotorPlaygroundWorker();
  const [datasets, setDatasets] = useState([] as EzDataset[]);

  useEffect(() => {
    worker.BuildDatasets(get.motorList.toDict()).then((ds) => setDatasets(ds));
  }, [get.motorList]);

  return (
    <>
      <div className="playground-container">
        <Graph
          options={graphConfig}
          simpleDatasets={datasets}
          title="Motor Playground"
          id="motorGraph"
        />
      </div>
      <PlaygroundInput stateHook={[get.motorList, set.setMotorList]} />
    </>
  );
}
