import Graph from "common/components/graphing/Graph";
import {
  GraphConfig,
  GraphDataPoint,
} from "common/components/graphing/graphConfig";
import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { MeasurementInput } from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Column, Columns } from "common/components/styling/Building";
import { useAsyncMemo } from "common/hooks/useAsyncMemo";
import Measurement from "common/models/Measurement";
import { useGettersSetters } from "common/tooling/conversion";
import { useMemo } from "react";
import {
  linearGraphConfig,
  LinearParamsV1,
  LinearStateV1,
} from "web/calculators/linear";
import { LinearState } from "web/calculators/linear/converter";
import {
  calculateCurrentDraw,
  calculateDragLoad,
  calculateLoadedSpeed,
  calculateTimeToGoal,
  calculateUnloadedSpeed,
} from "web/calculators/linear/linearMath";
import KgKvKaDisplay from "web/calculators/shared/components/KgKvKaDisplay";
import MotorSelector from "web/calculators/shared/components/MotorSelector";
import {
  calculateKa,
  calculateKg,
  calculateKv,
} from "web/calculators/shared/sharedMath";
import { useLinearWorker } from "web/calculators/workers";

export default function LinearCalculator(): JSX.Element {
  const worker = useLinearWorker();

  const [get, set] = useGettersSetters(LinearState.getState() as LinearStateV1);

  const unloadedSpeed = useMemo(
    () => calculateUnloadedSpeed(get.motor, get.spoolDiameter, get.ratio),
    [get.motor, get.spoolDiameter, get.ratio]
  );

  const loadedSpeed = useMemo(
    () =>
      calculateLoadedSpeed(
        get.motor,
        get.spoolDiameter,
        get.ratio,
        get.efficiency,
        get.load
      ),
    [get.motor, get.spoolDiameter, get.ratio, get.efficiency, get.load]
  );

  const unloadedTimeToGoal = useMemo(
    () => calculateTimeToGoal(unloadedSpeed, get.travelDistance),
    [get.travelDistance, unloadedSpeed]
  );

  const loadedTimeToGoal = useMemo(
    () => calculateTimeToGoal(loadedSpeed, get.travelDistance),
    [get.travelDistance, loadedSpeed]
  );

  const dragLoad = useMemo(
    () =>
      calculateDragLoad(
        get.motor,
        get.spoolDiameter,
        get.ratio,
        get.efficiency
      ).negate(),
    [get.motor, get.spoolDiameter, get.ratio, get.efficiency]
  );

  const timeToGoalStates = useAsyncMemo(
    [] as GraphDataPoint[],
    () =>
      worker.generateTimeToGoalChartData(
        get.motor.toDict(),
        get.travelDistance.toDict(),
        get.spoolDiameter.toDict(),
        get.load.toDict(),
        get.ratio.toDict(),
        get.efficiency
      ),
    [
      get.motor,
      get.travelDistance,
      get.spoolDiameter,
      get.load,
      get.ratio,
      get.efficiency,
    ]
  );

  const currentDrawStates = useAsyncMemo(
    [] as GraphDataPoint[],
    () =>
      worker.generateCurrentDrawChartData(
        get.motor.toDict(),
        get.spoolDiameter.toDict(),
        get.load.toDict(),
        get.ratio.toDict()
      ),
    [get.motor, get.spoolDiameter, get.load, get.ratio, get.efficiency]
  );

  const currentDraw = useMemo(
    () =>
      calculateCurrentDraw(get.motor, get.spoolDiameter, get.load, get.ratio),
    [get.motor, get.spoolDiameter, get.load, get.ratio]
  );

  const kG = useMemo(
    () =>
      calculateKg(
        get.motor.stallTorque.mul(get.motor.quantity).mul(get.ratio.asNumber()),
        get.spoolDiameter.div(2),
        get.load.mul(get.efficiency / 100)
      ),
    [
      get.motor.stallTorque,
      get.motor.quantity,
      get.efficiency,
      get.ratio,
      get.load,
      get.spoolDiameter,
    ]
  );

  const kV = useMemo(
    () =>
      calculateKv(
        get.motor.freeSpeed.div(get.ratio.asNumber()),
        get.spoolDiameter.div(2)
      ),
    [get.motor.freeSpeed, get.spoolDiameter]
  );

  const kA = useMemo(
    () =>
      calculateKa(
        get.motor.stallTorque
          .mul(get.motor.quantity)
          .mul(get.ratio.asNumber())
          .mul(get.efficiency / 100),
        get.spoolDiameter.div(2),
        get.load
      ),
    [
      get.motor.stallTorque,
      get.motor.quantity,
      get.efficiency,
      get.ratio,
      get.spoolDiameter,
      get.load,
    ]
  );

  return (
    <>
      <SimpleHeading
        queryParams={LinearParamsV1}
        state={get}
        title="Linear Mechanism Calculator"
      />

      <Columns desktop>
        <Column>
          <MotorSelector get={get} set={set} />
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
                  stateHook={[loadedSpeed, () => undefined]}
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
                  stateHook={[loadedTimeToGoal, () => undefined]}
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
                  stateHook={[unloadedSpeed, () => undefined]}
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
                  stateHook={[unloadedTimeToGoal, () => undefined]}
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
              stateHook={[dragLoad, () => undefined]}
              numberRoundTo={2}
              defaultUnit="lbs"
            />
          </SingleInputLine>
          <SingleInputLine
            label="Estimated Current Draw"
            id="currentDraw"
            tooltip="The estimated current draw per motor."
          >
            <MeasurementOutput
              stateHook={[currentDraw, () => undefined]}
              numberRoundTo={1}
              defaultUnit="A"
            />
          </SingleInputLine>
          <KgKvKaDisplay kG={kG} kV={kV} kA={kA} distanceType={"linear"} />
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
