import Graph from "common/components/graphing/Graph";
import {
  GraphConfig,
  GraphDataPoint,
} from "common/components/graphing/graphConfig";
import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  MeasurementInput,
  MotorInput,
  NumberInput,
  RatioInput,
} from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Column, Columns } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import { useGettersSetters } from "common/tooling/conversion";
import { useEffect, useState } from "react";
import {
  linearGraphConfig,
  LinearParamsV1,
  LinearStateV1,
} from "web/calculators/linear";
import { LinearState } from "web/calculators/linear/converter";
import {
  calculateDragLoad,
  calculateLoadedSpeed,
  calculateTimeToGoal,
  calculateUnloadedSpeed,
} from "web/calculators/linear/linearMath";
import { useLinearWorker } from "web/calculators/workers";

export default function LinearCalculator(): JSX.Element {
  const worker = useLinearWorker();

  const [get, set] = useGettersSetters(LinearState.getState() as LinearStateV1);
  const calculate = {
    unloadedSpeed: () =>
      calculateUnloadedSpeed(get.motor, get.spoolDiameter, get.ratio),
    loadedSpeed: () =>
      calculateLoadedSpeed(
        get.motor,
        get.spoolDiameter,
        get.ratio,
        get.efficiency,
        get.load
      ),
    unloadedTimeToGoal: () =>
      calculateTimeToGoal(unloadedSpeed, get.travelDistance),
    loadedTimeToGoal: () =>
      calculateTimeToGoal(loadedSpeed, get.travelDistance),
    timeToGoalStates: () =>
      worker.generateTimeToGoalChartData(
        get.motor.toDict(),
        get.travelDistance.toDict(),
        get.spoolDiameter.toDict(),
        get.load.toDict(),
        get.ratio.toDict(),
        get.efficiency
      ),
    currentDrawStates: () =>
      worker.generateCurrentDrawChartData(
        get.motor.toDict(),
        get.spoolDiameter.toDict(),
        get.load.toDict(),
        get.ratio.toDict()
      ),
    dragLoad: () =>
      calculateDragLoad(
        get.motor,
        get.spoolDiameter,
        get.ratio,
        get.efficiency
      ).negate(),
  };

  const [unloadedSpeed, setUnloadedSpeed] = useState(calculate.unloadedSpeed());
  const [loadedSpeed, setLoadedSpeed] = useState(calculate.loadedSpeed());
  const [unloadedTimeToGoal, setUnloadedTimeToGoal] = useState(
    calculate.unloadedTimeToGoal()
  );
  const [loadedTimeToGoal, setLoadedTimeToGoal] = useState(
    calculate.loadedTimeToGoal()
  );
  const [dragLoad, setDragLoad] = useState(calculate.dragLoad());

  const [timeToGoalStates, setTimeToGoalStates] = useState(
    [] as GraphDataPoint[]
  );
  const [currentDrawStates, setCurrentDrawStates] = useState(
    [] as GraphDataPoint[]
  );

  useEffect(() => {
    setUnloadedSpeed(calculate.unloadedSpeed());
  }, [get.motor, get.spoolDiameter, get.ratio]);

  useEffect(() => {
    setLoadedSpeed(calculate.loadedSpeed());
  }, [get.motor, get.spoolDiameter, get.ratio, get.efficiency, get.load]);

  useEffect(() => {
    setLoadedTimeToGoal(calculate.loadedTimeToGoal());
  }, [get.travelDistance, loadedSpeed]);

  useEffect(() => {
    setUnloadedTimeToGoal(calculate.unloadedTimeToGoal());
  }, [get.travelDistance, unloadedSpeed]);

  useEffect(() => {
    setDragLoad(calculate.dragLoad());
  }, [get.motor, get.spoolDiameter, get.ratio, get.efficiency]);

  useEffect(() => {
    calculate.timeToGoalStates().then((d) => setTimeToGoalStates(d));
  }, [
    get.motor,
    get.travelDistance,
    get.spoolDiameter,
    get.load,
    get.ratio,
    get.efficiency,
  ]);

  useEffect(() => {
    calculate.currentDrawStates().then((d) => setCurrentDrawStates(d));
  }, [get.motor, get.spoolDiameter, get.load, get.ratio, get.efficiency]);

  return (
    <>
      <SimpleHeading
        queryParams={LinearParamsV1}
        state={get}
        title="Linear Mechanism Calculator"
      />

      <Columns>
        <Column>
          <SingleInputLine
            label="Motor"
            id="motor"
            tooltip="The motors powering the system."
          >
            <MotorInput stateHook={[get.motor, set.setMotor]} />
          </SingleInputLine>
          <SingleInputLine
            label="Efficiency (%)"
            id="efficiency"
            tooltip="The efficiency of the system in transmitting torque from the motors."
          >
            <NumberInput stateHook={[get.efficiency, set.setEfficiency]} />
          </SingleInputLine>
          <SingleInputLine
            label="Ratio"
            id="ratio"
            tooltip="The ratio between the motors and the system."
          >
            <RatioInput stateHook={[get.ratio, set.setRatio]} />
          </SingleInputLine>
          <SingleInputLine
            label="Travel Distance"
            id="comLength"
            tooltip="How far the system is traveling."
          >
            <MeasurementInput
              stateHook={[get.travelDistance, set.setTravelDistance]}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Spool Diameter"
            id="comLength"
            tooltip="The diameter of the part that rope may spool around. Use 1 if absent."
          >
            <MeasurementInput
              stateHook={[get.spoolDiameter, set.setSpoolDiameter]}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Load"
            id="comLength"
            tooltip="How much weight the system is lifting upwards."
          >
            <MeasurementInput stateHook={[get.load, set.setLoad]} />
          </SingleInputLine>
          <Columns formColumns>
            <Column>
              <SingleInputLine
                label="Loaded Top Speed&nbsp;&nbsp;&nbsp;"
                id="loadedTopSpeed"
                tooltip="How fast the system travels under expected load."
              >
                <MeasurementOutput
                  stateHook={[loadedSpeed, setLoadedSpeed]}
                  numberRoundTo={2}
                  dangerIf={() => loadedSpeed.lte(new Measurement(0, "ft/s"))}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Time To Goal"
                id="loadedTimeToGoal"
                tooltip="How long the system takes to travel the target distance under expected load."
              >
                <MeasurementOutput
                  stateHook={[loadedTimeToGoal, setLoadedTimeToGoal]}
                  numberRoundTo={2}
                  dangerIf={() => loadedSpeed.lte(new Measurement(0, "ft/s"))}
                />
              </SingleInputLine>
            </Column>
          </Columns>
          <Columns formColumns>
            <Column>
              <SingleInputLine
                label="Unloaded Top Speed"
                id="unloadedTopSpeed"
                tooltip="How fast the system would travel if no load were present."
              >
                <MeasurementOutput
                  stateHook={[unloadedSpeed, setUnloadedSpeed]}
                  numberRoundTo={2}
                  dangerIf={() => unloadedSpeed.lte(new Measurement(0, "ft/s"))}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Time To Goal"
                id="unloadedTimeToGoal"
                tooltip="How long the system takes to travel the target distance if no load were present."
              >
                <MeasurementOutput
                  stateHook={[unloadedTimeToGoal, setUnloadedTimeToGoal]}
                  numberRoundTo={2}
                  dangerIf={() => unloadedSpeed.lte(new Measurement(0, "ft/s"))}
                />
              </SingleInputLine>
            </Column>
          </Columns>
          <SingleInputLine
            label="Stall Load"
            id="stallLoad"
            tooltip="The amount of weight the system can handle before stalling."
          >
            <MeasurementOutput
              stateHook={[dragLoad, setDragLoad]}
              numberRoundTo={2}
              defaultUnit="lbs"
            />
          </SingleInputLine>
        </Column>
        <Column>
          <Graph
            options={linearGraphConfig}
            data={{
              datasets: [
                GraphConfig.dataset(
                  "Time to Goal (s)",
                  timeToGoalStates.filter((s) => s.y > 0),
                  0,
                  "y-time"
                ),
                GraphConfig.dataset(
                  "Current Draw (A)",
                  currentDrawStates,
                  1,
                  "y-current"
                ),
              ],
            }}
            type="line"
            title=""
            id="linearGraph"
            height={800}
          />
        </Column>
      </Columns>
    </>
  );
}
