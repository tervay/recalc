import Graph from "common/components/graphing/Graph";
import { GraphConfig } from "common/components/graphing/graphConfig";
import SimpleHeading from "common/components/heading/SimpleHeading";
import PistonInput from "common/components/io/inputs/PistonInput";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import CompressorInput from "common/components/io/new/inputs/L3/CompressorInput";
import MeasurementInput from "common/components/io/new/inputs/L3/MeasurementInput";
import NumericOutput from "common/components/io/outputs/NumberOutput";
import { Button, Column, Columns } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import Piston from "common/models/Piston";
import PistonList, { getNumberFromPistonName } from "common/models/PistonList";
import { useGettersSetters } from "common/tooling/conversion";
import { wrap } from "common/tooling/promise-worker";
import { NoOp, getRandomInteger } from "common/tooling/util";
import { useEffect, useState } from "react";
import usePromise from "react-use-promise";
import {
  PneumaticsParamsV1,
  PneumaticsStateV1,
  pneumaticsGraphConfig,
} from "web/calculators/pneumatics";
import { PneumaticsState } from "web/calculators/pneumatics/converter";
import {
  PneumaticWorkerFunctions,
  generatePressureTimeline,
} from "web/calculators/pneumatics/math";
import rawWorker from "web/calculators/pneumatics/math?worker";

const worker = await wrap<PneumaticWorkerFunctions>(new rawWorker());

const defaultPiston = (pl: PistonList) => {
  const maxFound = Math.max(
    ...pl.pistons.map((p) => getNumberFromPistonName(p.identifier))
  );
  const n = [-Infinity, Infinity, NaN].includes(maxFound) ? 1 : maxFound + 1;

  return new Piston(
    `Piston ${n}`,
    1,
    new Measurement(getRandomInteger(1, 6) / 2, "in"),
    new Measurement(getRandomInteger(1, 12) / 16, "in"),
    new Measurement(getRandomInteger(1, 12), "in"),
    new Measurement(getRandomInteger(15, 60), "psi"),
    new Measurement(getRandomInteger(15, 60), "psi"),
    true,
    new Measurement(getRandomInteger(4, 16), "s")
  );
};

export default function PneumaticsCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(
    PneumaticsState.getState() as PneumaticsStateV1
  );

  const calculate = {
    timelineAndDutyCycle: () =>
      generatePressureTimeline(get.pistons, get.tankVolume, get.compressor),
    timeline: () => timelineAndDutyCycle.timeline,
    dutyCycle: () => timelineAndDutyCycle.dutyCycle,
    recommendedTanks: () =>
      worker.getRecommendedTanks(get.pistons.toDict(), get.compressor.toDict()),
  };

  const [timelineAndDutyCycle, setTimelineAndDutyCycle] = useState(
    calculate.timelineAndDutyCycle()
  );
  const [timeline, setTimeline] = useState(calculate.timeline());
  const [dutyCycle, setDutyCycle] = useState(calculate.dutyCycle());
  const [recommendedTanks, _error, _state] = usePromise(
    calculate.recommendedTanks,
    [get.pistons.pistons, get.compressor]
  );

  useEffect(() => {
    setTimelineAndDutyCycle(calculate.timelineAndDutyCycle());
  }, [get.pistons, get.tankVolume, get.compressor]);

  useEffect(() => {
    setTimeline(calculate.timeline());
    setDutyCycle(calculate.dutyCycle());
  }, [timelineAndDutyCycle]);

  return (
    <>
      <SimpleHeading
        queryParams={PneumaticsParamsV1}
        state={get}
        title="Pneumatics Calculator"
      />
      <Graph
        options={pneumaticsGraphConfig}
        simpleDatasets={[
          GraphConfig.dataset("System Pressure (psi)", timeline, 0, "y"),
        ]}
        title="System Pressure Over Time"
        id="pneumaticsGraph"
      />
      <Columns multiline centered>
        <Column narrow>
          <Button
            color={"primary"}
            onClick={() => {
              set.setPistons(
                get.pistons.copyAndAdd(defaultPiston(get.pistons))
              );
            }}
            faIcon="plus"
          >
            Add Cylinder
          </Button>
        </Column>
        <Column>
          <SingleInputLine
            label="Tank Volume"
            id="tankVolumeInput"
            tooltip="The total volume of pneumatic tanks on the robot. The most common size is 574mL."
          >
            <MeasurementInput stateHook={[get.tankVolume, set.setTankVolume]} />
          </SingleInputLine>
        </Column>
        <Column narrow>
          <SingleInputLine
            label="Compressor"
            id="compressor"
            tooltip="The compressor powering the system."
          >
            <CompressorInput stateHook={[get.compressor, set.setCompressor]} />
          </SingleInputLine>
        </Column>
        <Column narrow>
          <SingleInputLine
            label="Compressor Duty Cycle (%)"
            id="dutyCycleOutput"
            tooltip="How often the compressor is running during a match."
          >
            <NumericOutput stateHook={[dutyCycle, setDutyCycle]} roundTo={2} />
          </SingleInputLine>
        </Column>
        <Column narrow>
          <SingleInputLine
            label="Recommended KOP Tanks"
            id="recommendedTanks"
            tooltip="The number of 574mL tanks required to not drop below 20psi during a match."
          >
            <NumericOutput
              stateHook={[recommendedTanks || 0, NoOp]}
              loadingIf={() => [0, undefined].includes(recommendedTanks)}
              roundTo={0}
            />
          </SingleInputLine>
        </Column>
      </Columns>

      <Columns multiline centered>
        {get.pistons.pistons.map((p) => (
          <Column ofTwelve={4} key={`Column-${p.identifier}`}>
            <PistonInput
              piston={p}
              name={p.identifier}
              removeFn={() => set.setPistons(get.pistons.copyAndRemove(p))}
              stateHook={[get.pistons, set.setPistons]}
            />
          </Column>
        ))}
      </Columns>
    </>
  );
}
