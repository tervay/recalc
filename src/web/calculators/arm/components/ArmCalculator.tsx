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
import { useMemo, useState } from "react";
import { armGraphConfig, ArmParamsV1, ArmStateV1 } from "web/calculators/arm";
import { MomentaryArmState } from "web/calculators/arm/armMath";
import { ArmState } from "web/calculators/arm/converter";
import KgKvKaDisplay from "web/calculators/shared/components/KgKvKaDisplay";
import {
  calculateKa,
  calculateKg,
  calculateKv,
} from "web/calculators/shared/sharedMath";
import { useArmWorker } from "web/calculators/workers";

export default function ArmCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(ArmState.getState() as ArmStateV1);
  const worker = useArmWorker();

  const [isCalculating, setIsCalculating] = useState(true);

  const states = useAsyncMemo(
    [] as MomentaryArmState[],
    async () => {
      setIsCalculating(true);
      const states = await worker.calculateArmStates(
        get.motor.toDict(),
        get.ratio.toDict(),
        get.comLength.toDict(),
        get.armMass.toDict(),
        get.currentLimit.toDict(),
        get.startAngle.toDict(),
        get.endAngle.toDict(),
        get.iterationLimit
      );
      setIsCalculating(false);
      return states;
    },
    [
      get.motor,
      get.ratio,
      get.comLength,
      get.armMass,
      get.currentLimit,
      get.startAngle,
      get.endAngle,
      get.iterationLimit,
    ]
  );

  const timeToGoal = useMemo(
    () =>
      states.length > 0
        ? Measurement.fromDict(states[states.length - 1].time)
        : new Measurement(0, "s"),
    [states]
  );

  const kG = useMemo(
    () =>
      calculateKg(
        get.motor.stallTorque.mul(get.motor.quantity).mul(get.ratio.asNumber()),
        get.comLength,
        get.armMass.mul(get.efficiency / 100)
      ),
    [
      get.motor.stallTorque,
      get.motor.quantity,
      get.ratio,
      get.comLength,
      get.armMass,
      get.efficiency,
    ]
  );

  const kV = useMemo(
    () =>
      calculateKv(
        get.motor.freeSpeed.div(get.ratio.asNumber()),
        new Measurement(1, "rad")
      ),
    [get.motor.freeSpeed, get.ratio]
  );

  const kA = useMemo(
    () =>
      calculateKa(
        get.motor.stallTorque
          .mul(get.motor.quantity)
          .mul(get.ratio.asNumber())
          .mul(get.efficiency / 100),
        get.comLength.mul(get.comLength).div(new Measurement(1, "rad")),
        get.armMass
      ),
    [
      get.motor.stallTorque,
      get.motor.quantity,
      get.ratio,
      get.efficiency,
      get.comLength,
      get.armMass,
    ]
  );

  return (
    <>
      <SimpleHeading
        queryParams={ArmParamsV1}
        state={get}
        title="Arm Calculator"
      />

      <Columns>
        <Column>
          <SingleInputLine
            label="Motor"
            id="motor"
            tooltip="Motors powering the arm."
          >
            <MotorInput stateHook={[get.motor, set.setMotor]} />
          </SingleInputLine>
          <SingleInputLine
            label="Ratio"
            id="ratio"
            tooltip="Ratio of the gearbox."
          >
            <RatioInput stateHook={[get.ratio, set.setRatio]} />
          </SingleInputLine>
          <SingleInputLine
            label="Efficiency (%)"
            id="efficiency"
            tooltip="The efficiency of the system in transmitting torque from the motors."
          >
            <NumberInput stateHook={[get.efficiency, set.setEfficiency]} />
          </SingleInputLine>
          <SingleInputLine
            label="Current Limit"
            id="currentLimit"
            tooltip="Current limit applied to each motor."
          >
            <MeasurementInput
              stateHook={[get.currentLimit, set.setCurrentLimit]}
            />
          </SingleInputLine>
          <SingleInputLine
            label="CoM Distance"
            id="comLength"
            tooltip={
              <>
                Distance of the center of mass
                <br />
                from the rotation point.
              </>
            }
          >
            <MeasurementInput stateHook={[get.comLength, set.setComLength]} />
          </SingleInputLine>
          <SingleInputLine
            label="Arm Mass"
            id="armMass"
            tooltip={
              <>
                Mass of the arm measured
                <br /> at the center of mass.
              </>
            }
          >
            <MeasurementInput stateHook={[get.armMass, set.setArmMass]} />
          </SingleInputLine>
          <SingleInputLine
            label="Start Angle"
            id="startAngle"
            tooltip={
              <>
                Starting angle of the arm.
                <br />
                Must be less than end angle.
              </>
            }
          >
            <MeasurementInput stateHook={[get.startAngle, set.setStartAngle]} />
          </SingleInputLine>
          <SingleInputLine
            label="End Angle"
            id="endAngle"
            tooltip={
              <>
                Ending angle of the arm.
                <br />
                Must be greater than start angle.
              </>
            }
          >
            <MeasurementInput stateHook={[get.endAngle, set.setEndAngle]} />
          </SingleInputLine>
          <SingleInputLine
            label="Iteration Limit"
            id="iterationLimit"
            tooltip="Number of time-cycles to simulate."
          >
            <NumberInput
              stateHook={[get.iterationLimit, set.setIterationLimit]}
            />
          </SingleInputLine>

          <SingleInputLine
            label="Time To Goal"
            id="timeToGoal"
            tooltip="Time from start angle to end angle."
          >
            <MeasurementOutput
              stateHook={[timeToGoal, () => undefined]}
              numberRoundTo={3}
              loadingIf={() => isCalculating}
            />
          </SingleInputLine>
          <Message color="warning">
            The time to goal currently <b>does not</b> account for deceleration
            of the arm when approaching the target. It <b>does</b> account for
            the initial acceleration from zero. <br />
            <br />
            For more clarifying info, click the <code>Docs</code> expandable
            below.
          </Message>
          <KgKvKaDisplay kG={kG} kV={kV} kA={kA} distanceType={"angular"} />
        </Column>
        <Column>
          <Graph
            options={armGraphConfig}
            data={{
              datasets: [
                GraphConfig.dataset(
                  "Position (deg)",
                  states.map((s) => ({
                    x: Measurement.fromDict(s.time).scalar,
                    y: Measurement.fromDict(s.position).to("deg").scalar,
                  })),
                  0,
                  "y-position"
                ),
                GraphConfig.dataset(
                  "Current (A)",
                  states.map((s) => ({
                    x: Measurement.fromDict(s.time).scalar,
                    y: Measurement.fromDict(s.motorState.current).to("A")
                      .scalar,
                  })),
                  1,
                  "y-current"
                ),
                GraphConfig.dataset(
                  "Motor RPM",
                  states.map((s) => ({
                    x: Measurement.fromDict(s.time).scalar,
                    y: Measurement.fromDict(s.motorState.rpm).to("rpm").scalar,
                  })),
                  2,
                  "y-rpm"
                ),
                GraphConfig.dataset(
                  "Motor Torque",
                  states.map((s) => ({
                    x: Measurement.fromDict(s.time).scalar,
                    y: Measurement.fromDict(s.motorState.torque).to("N m")
                      .scalar,
                  })),
                  3,
                  "y-torque"
                ),
              ],
            }}
            type="line"
            title=""
            id="armGraph"
            height={800}
          />
        </Column>
      </Columns>
    </>
  );
}
