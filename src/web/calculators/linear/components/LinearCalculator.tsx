import Graph from "common/components/graphing/Graph";
import { GraphConfig } from "common/components/graphing/graphConfig";
import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  MeasurementInput,
  MotorInput,
  NumberInput,
  RatioInput,
} from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Column, Columns, Message } from "common/components/styling/Building";
import { useAsyncMemo } from "common/hooks/useAsyncMemo";
import Measurement from "common/models/Measurement";
import { useGettersSetters } from "common/tooling/conversion";
import { wrap } from "common/tooling/promise-worker";
import { maxBy } from "lodash";
import { useMemo } from "react";
import {
  LinearParamsV1,
  LinearStateV1,
  linearGraphConfig,
} from "web/calculators/linear";
import { LinearState } from "web/calculators/linear/converter";
import {
  LinearWorkerFunctions,
  calculateStallLoad,
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

  const moi = useMemo(
    () =>
      get.ratio.asNumber() === 0
        ? new Measurement(0, "kg m2")
        : get.load
            .mul(get.spoolDiameter.div(2))
            .mul(get.spoolDiameter.div(2))
            .div(get.ratio.asNumber())
            .div(get.ratio.asNumber()),
    [get.load, get.angle, get.ratio, get.spoolDiameter],
  );

  const odeChartData = useAsyncMemo(
    {
      position: [],
      velocity: [],
      currentDraw: [],
    },
    () =>
      worker.generateODEData(
        get.motor.toDict(),
        get.currentLimit.toDict(),
        get.travelDistance.toDict(),
        get.ratio.toDict(),
        get.spoolDiameter.toDict(),
        get.load.toDict(),
        moi.toDict(),
        get.efficiency,
        get.angle.toDict(),
      ),
    [
      get.motor,
      get.currentLimit,
      get.travelDistance,
      get.ratio,
      get.spoolDiameter,
      moi,
      get.efficiency,
      get.angle,
    ],
  );

  const kG = useMemo(
    () =>
      calculateKg(
        get.motor.stallTorque.mul(get.motor.quantity).mul(get.ratio.asNumber()),
        get.spoolDiameter.div(2),
        get.load.mul(get.efficiency / 100),
      ).mul(Math.sin(get.angle.to("rad").scalar)),
    [
      get.motor.stallTorque,
      get.motor.quantity,
      get.efficiency,
      get.ratio,
      get.load,
      get.spoolDiameter,
      get.angle,
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

  const maxVelocity = useMemo(
    () =>
      new Measurement(maxBy(odeChartData.velocity, (v) => v.y)?.y ?? 0, "in/s"),
    [odeChartData],
  );

  const timeToGoal = useMemo(() => {
    if (maxVelocity.to("in/s").scalar < 1) {
      return new Measurement(0, "s");
    } else {
      return new Measurement(
        odeChartData.position.length === 0
          ? 0
          : odeChartData.position[odeChartData.position.length - 1].x,
        "s",
      );
    }
  }, [odeChartData]);

  const stallLoad = useMemo(
    () =>
      calculateStallLoad(
        get.motor,
        get.currentLimit,
        get.spoolDiameter,
        get.ratio,
        get.efficiency,
      ).negate(),
    [get.motor, get.currentLimit, get.spoolDiameter, get.ratio, get.efficiency],
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
            <MotorInput
              stateHook={[get.motor, set.setMotor]}
              numberDelay={500}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Efficiency (%)"
            id="efficiency"
            tooltip="The efficiency of the system in transmitting torque from the motors."
          >
            <NumberInput
              stateHook={[get.efficiency, set.setEfficiency]}
              delay={500}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Ratio"
            id="ratio"
            tooltip="The ratio between the motors and the system."
          >
            <RatioInput
              stateHook={[get.ratio, set.setRatio]}
              numberDelay={500}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Travel Distance"
            id="comLength"
            tooltip="How far the system is traveling."
          >
            <MeasurementInput
              stateHook={[get.travelDistance, set.setTravelDistance]}
              numberDelay={500}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Spool Diameter"
            id="comLength"
            tooltip="The diameter of the part that rope may spool around. Use 1 if absent."
          >
            <MeasurementInput
              stateHook={[get.spoolDiameter, set.setSpoolDiameter]}
              numberDelay={500}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Load"
            id="comLength"
            tooltip="How much weight the system is lifting upwards."
          >
            <MeasurementInput
              stateHook={[get.load, set.setLoad]}
              numberDelay={500}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Current Limit"
            id="currentLimit"
            tooltip="Current limit on each motor."
          >
            <MeasurementInput
              stateHook={[get.currentLimit, set.setCurrentLimit]}
              dangerIf={() => get.currentLimit.gte(get.motor.stallCurrent)}
              warningIf={() =>
                get.currentLimit
                  .mul(get.currentLimit)
                  .mul(timeToGoal)
                  .gte(Measurement.STANDARD_BREAKER_ESTIMATE_I2T())
              }
              numberDelay={500}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Angle"
            id="angle"
            tooltip="Angle of the mechanism. 90 degrees is vertical (upright). 0 degrees is horizontal."
          >
            <MeasurementInput
              stateHook={[get.angle, set.setAngle]}
              numberDelay={500}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Time to Goal"
            id="timeToGoal"
            tooltip="How long it takes the system to reach the travel distance."
          >
            <MeasurementOutput
              stateHook={[timeToGoal, () => undefined]}
              numberRoundTo={2}
              dangerIf={() => timeToGoal.eq(new Measurement(0, "s"))}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Max Velocity"
            id="maxVelocity"
            tooltip="The highest velocity the system reaches during the motion profile."
          >
            <MeasurementOutput
              stateHook={[maxVelocity, () => undefined]}
              numberRoundTo={2}
              defaultUnit="in/s"
            />
          </SingleInputLine>
          <SingleInputLine
            label="Stall Load"
            id="stallLoad"
            tooltip="The highest weight the system can lift at all."
          >
            <MeasurementOutput
              stateHook={[stallLoad, () => undefined]}
              numberRoundTo={2}
              defaultUnit="lb"
            />
          </SingleInputLine>
          {/* <SingleInputLine
            label="MOI"
            id="moi"
            tooltip="The highest velocity the system reaches during the motion profile."
          >
            <MeasurementOutput
              stateHook={[moi, () => undefined]}
              numberRoundTo={4}
              defaultUnit="kg m^2"
            />
          </SingleInputLine> */}

          <KgKvKaDisplay kG={kG} kV={kV} kA={kA} distanceType={"linear"} />

          <Message color="danger">
            Please note the differences in carriage behavior between cascade and
            continuous elevators. In a 2-stage cascade elevator, the carriage
            will move twice as fast as the first stage with half as much torque.
            <br />
            <br />A cascade elevator mode will be added in the future.
          </Message>
        </Column>
        <Column>
          <Message color="warning">
            There is a small delay in output updates. The longer it takes to
            reach the goal, the slower the graph & outputs will be to update.
            This does <b>not</b> model deceleration.
          </Message>

          <Graph
            options={linearGraphConfig}
            simpleDatasets={[
              GraphConfig.dataset(
                "Position (in)",
                odeChartData.position,
                0,
                "y-position",
              ),
              GraphConfig.dataset(
                "Velocity (in/s)",
                odeChartData.velocity,
                1,
                "y-velocity",
              ),
              GraphConfig.dataset(
                "Current Draw (A)",
                odeChartData.currentDraw,
                2,
                "y-current",
              ),
            ]}
            title="Motion Profile over Time"
            id="linearGraph"
            height={800}
          />
        </Column>
      </Columns>
    </>
  );
}
