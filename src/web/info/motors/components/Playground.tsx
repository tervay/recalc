import Graph from "common/components/graphing/Graph";
import { EzDataset } from "common/components/graphing/types";
import { StateMaker, useGettersSetters } from "common/tooling/conversion";
import { wrap } from "common/tooling/promise-worker";
import { useEffect, useState } from "react";
import {
  MotorPlaygroundParams,
  MotorPlaygroundState,
  graphConfig,
} from "web/info/motors";
import PlaygroundInput from "web/info/motors/components/PlaygroundInput";
import { PlaygroundWorkerFunctions } from "web/info/motors/graphBuilder";
import rawWorker from "web/info/motors/graphBuilder?worker";

const worker = await wrap<PlaygroundWorkerFunctions>(new rawWorker());

export default function Playground(): JSX.Element {
  const [get, set] = useGettersSetters(
    StateMaker.BumpState(
      1,
      [MotorPlaygroundParams],
      [],
    ) as MotorPlaygroundState,
  );
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
