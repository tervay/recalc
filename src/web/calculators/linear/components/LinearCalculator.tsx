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
import { useAsyncMemo } from "common/hooks/useAsyncMemo";
import Measurement from "common/models/Measurement";
import { useGettersSetters } from "common/tooling/conversion";
import { wrap } from "common/tooling/promise-worker";
import { useMemo } from "react";
import {
  LinearParamsV1,
  LinearStateV1,
  linearGraphConfig,
} from "web/calculators/linear";
import { LinearState } from "web/calculators/linear/converter";
import {
  LinearWorkerFunctions,
  calculateProfiledTimeToGoal,
} from "web/calculators/linear/linearMath";
import rawWorker from "web/calculators/linear/linearMath?worker";
import KgKvKaDisplay from "web/calculators/shared/components/KgKvKaDisplay";
import {
  calculateKa,
  calculateKg,
  calculateKv,
} from "web/calculators/shared/sharedMath";

const worker = await wrap<LinearWorkerFunctions>(new rawWorker());

export default function LinearCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(LinearState.getState() as LinearStateV1);

  const profiledTimeToGoal = useMemo(
    () =>
      calculateProfiledTimeToGoal(
        get.motor,
        get.currentLimit,
        get.ratio,
        get.spoolDiameter,
        get.load,
        get.travelDistance,
        get.angle,
        get.efficiency,
      ),
    [
      get.motor,
      get.currentLimit,
      get.ratio,
      get.spoolDiameter,
      get.load,
      get.travelDistance,
      get.efficiency,
      get.angle,
    ],
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
        get.efficiency,
      ),
    [
      get.motor,
      get.travelDistance,
      get.spoolDiameter,
      get.load,
      get.ratio,
      get.efficiency,
    ],
  );

  const currentDrawStates = useAsyncMemo(
    [] as GraphDataPoint[],
    () =>
      worker.generateCurrentDrawChartData(
        get.motor.toDict(),
        get.spoolDiameter.toDict(),
        get.load.toDict(),
        get.ratio.toDict(),
      ),
    [get.motor, get.spoolDiameter, get.load, get.ratio, get.efficiency],
  );

  const kG = useMemo(
    () =>
      calculateKg(
        get.motor.stallTorque.mul(get.motor.quantity).mul(get.ratio.asNumber()),
        get.spoolDiameter.div(2),
        get.load.mul(get.efficiency / 100),
      ),
    [
      get.motor.stallTorque,
      get.motor.quantity,
      get.efficiency,
      get.ratio,
      get.load,
      get.spoolDiameter,
    ],
  );

  const kV = useMemo(() => {
    if (get.ratio.asNumber() == 0) {
      return new Measurement(0, "V*s/m");
    }

    return calculateKv(
      get.motor.freeSpeed.div(get.ratio.asNumber()),
      get.spoolDiameter.div(2),
    );
  }, [get.motor.freeSpeed, get.spoolDiameter]);

  const kA = useMemo(
    () =>
      calculateKa(
        get.motor.stallTorque
          .mul(get.motor.quantity)
          .mul(get.ratio.asNumber())
          .mul(get.efficiency / 100),
        get.spoolDiameter.div(2),
        get.load,
      ),
    [
      get.motor.stallTorque,
      get.motor.quantity,
      get.efficiency,
      get.ratio,
      get.spoolDiameter,
      get.load,
    ],
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
          <SingleInputLine label="Current Limit" id="currentLimit" tooltip="">
            <MeasurementInput
              stateHook={[get.currentLimit, set.setCurrentLimit]}
              dangerIf={() => get.currentLimit.gte(get.motor.stallCurrent)}
              warningIf={() =>
                get.currentLimit
                  .mul(get.currentLimit)
                  .mul(profiledTimeToGoal.smartTimeToGoal)
                  .gte(
                    new Measurement(40, "A")
                      .mul(new Measurement(40, "A"))
                      .mul(new Measurement(10, "s")),
                  )
              }
            />
          </SingleInputLine>
          <SingleInputLine label="Angle" id="angle" tooltip="">
            <MeasurementInput stateHook={[get.angle, set.setAngle]} />
          </SingleInputLine>

          <Columns formColumns>
            <Column>
              <SingleInputLine
                label="Accel Time"
                id="profiledTTG"
                tooltip="The amount of weight the system can handle before stalling."
              >
                <MeasurementOutput
                  stateHook={[
                    profiledTimeToGoal.accelerationPhaseDuration,
                    () => undefined,
                  ]}
                  numberRoundTo={2}
                  defaultUnit="s"
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Cruise Time"
                id="profiledTTG"
                tooltip="The amount of weight the system can handle before stalling."
              >
                <MeasurementOutput
                  stateHook={[
                    profiledTimeToGoal.constantVelocityPhaseDuration,
                    () => undefined,
                  ]}
                  numberRoundTo={2}
                  defaultUnit="s"
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Columns formColumns>
            <Column>
              <SingleInputLine
                label="Time to Goal"
                id="loadedTopSpeed"
                tooltip="How fast the system travels under expected load."
              >
                <MeasurementOutput
                  stateHook={[
                    profiledTimeToGoal.smartTimeToGoal,
                    () => undefined,
                  ]}
                  numberRoundTo={2}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Max Velocity"
                id="loadedTimeToGoal"
                tooltip="How long the system takes to travel the target distance under expected load."
              >
                <MeasurementOutput
                  stateHook={[profiledTimeToGoal.topSpeed, () => undefined]}
                  numberRoundTo={2}
                />
              </SingleInputLine>
            </Column>
          </Columns>
          <KgKvKaDisplay kG={kG} kV={kV} kA={kA} distanceType={"linear"} />
        </Column>
        <Column>
          <Graph
            options={linearGraphConfig}
            simpleDatasets={[
              GraphConfig.dataset(
                "Time to Goal (s)",
                timeToGoalStates.filter((s) => s.y > 0),
                0,
                "y-time",
              ),
              GraphConfig.dataset(
                "Current Draw (A)",
                currentDrawStates,
                1,
                "y-current",
              ),
            ]}
            title=""
            id="linearGraph"
            height={800}
          />
        </Column>
      </Columns>
    </>
  );
}
