import Graph from "common/components/graphing/Graph";
import {
  GraphConfig,
  GraphDataPoint,
} from "common/components/graphing/graphConfig";
import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  BooleanInput,
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
        get.limitAcceleration ? get.limitedAcceleration : undefined,
        get.limitDeceleration ? get.limitedDeceleration : undefined,
        get.limitVelocity ? get.limitedVelocity : undefined,
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
      get.limitAcceleration,
      get.limitedAcceleration,
      get.limitDeceleration,
      get.limitedDeceleration,
      get.limitVelocity,
      get.limitedVelocity,
    ],
  );

  const chartData = useAsyncMemo(
    { position: [] as GraphDataPoint[], velocity: [] as GraphDataPoint[] },
    () =>
      worker.generateTimeToGoalChartData(
        get.motor.toDict(),
        get.currentLimit.toDict(),
        get.ratio.toDict(),
        get.spoolDiameter.toDict(),
        get.load.toDict(),
        get.travelDistance.toDict(),
        get.angle.toDict(),
        get.efficiency,
        get.limitAcceleration ? get.limitedAcceleration.toDict() : undefined,
        get.limitDeceleration ? get.limitedDeceleration.toDict() : undefined,
        get.limitVelocity ? get.limitedVelocity.toDict() : undefined,
      ),
    [
      get.motor,
      get.currentLimit,
      get.ratio,
      get.spoolDiameter,
      get.load,
      get.travelDistance,
      get.angle,
      get.efficiency,
      get.limitAcceleration,
      get.limitedAcceleration,
      get.limitDeceleration,
      get.limitedDeceleration,
      get.limitVelocity,
      get.limitedVelocity,
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
                  .mul(profiledTimeToGoal.smartTimeToGoal)
                  .gte(Measurement.STANDARD_BREAKER_ESTIMATE_I2T())
              }
            />
          </SingleInputLine>
          <SingleInputLine
            label="Angle"
            id="angle"
            tooltip="Angle of the mechanism. 90 degrees is vertical (upright). 0 degrees is horizontal."
          >
            <MeasurementInput stateHook={[get.angle, set.setAngle]} />
          </SingleInputLine>
          <Columns formColumns>
            <Column ofTwelve={3}>
              <SingleInputLine label="Limit Velocity">
                <BooleanInput
                  stateHook={[get.limitVelocity, set.setLimitVelocity]}
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Velocity Limit"
                id="velocityLimit"
                tooltip={
                  "The limit upon the magnitude of acceleration that the motors can produce going upwards. " +
                  "Should always be positive; ReCalc will handle directions for you."
                }
              >
                <MeasurementInput
                  stateHook={[get.limitedVelocity, set.setLimitedVelocity]}
                  numberRoundTo={1}
                  numberDisabledIf={() => !get.limitVelocity}
                />
              </SingleInputLine>
            </Column>
          </Columns>
          <Columns formColumns>
            <Column>
              <SingleInputLine label="Limit Acceleration">
                <BooleanInput
                  stateHook={[get.limitAcceleration, set.setLimitAcceleration]}
                />
              </SingleInputLine>
            </Column>

            <Column>
              <SingleInputLine label="Limit Deceleration">
                <BooleanInput
                  stateHook={[get.limitDeceleration, set.setLimitDeceleration]}
                />
              </SingleInputLine>
            </Column>
          </Columns>

          {(get.limitAcceleration || get.limitDeceleration) && (
            <Columns formColumns>
              <Column>
                {get.limitAcceleration && (
                  <SingleInputLine
                    label="Accel Limit"
                    id="accelLimit"
                    tooltip={
                      "The limit upon the magnitude of acceleration that the motors can produce going upwards. " +
                      "Should always be positive; ReCalc will handle directions for you."
                    }
                  >
                    <MeasurementInput
                      stateHook={[
                        get.limitedAcceleration,
                        set.setLimitedAcceleration,
                      ]}
                      numberRoundTo={1}
                      numberDisabledIf={() => !get.limitAcceleration}
                      defaultUnit="in/s2"
                    />
                  </SingleInputLine>
                )}
              </Column>

              <Column>
                {get.limitDeceleration && (
                  <SingleInputLine
                    label="Decel Limit"
                    id="decelLimit"
                    tooltip={
                      "The limit upon the magnitude of acceleration that the motors can produce going downwards. " +
                      "Should always be positive; ReCalc will handle directions for you."
                    }
                  >
                    <MeasurementInput
                      stateHook={[
                        get.limitedDeceleration,
                        set.setLimitedDeceleration,
                      ]}
                      numberRoundTo={1}
                      numberDisabledIf={() => !get.limitDeceleration}
                      defaultUnit="in/s2"
                    />
                  </SingleInputLine>
                )}
              </Column>
            </Columns>
          )}

          <Columns formColumns>
            <Column>
              <SingleInputLine
                label="Accel Time"
                id="accelTime"
                tooltip="The duration the system is accelerating in the motion profile."
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
                label="Decel Time"
                id="decelTime"
                tooltip="The duration the system is decelerating in the motion profile."
              >
                <MeasurementOutput
                  stateHook={[
                    profiledTimeToGoal.decelerationPhaseDuration,
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
                label="Acceleration"
                id="accelTime"
                tooltip={
                  "The magnitude of acceleration the system experiences going upwards. " +
                  "Includes both motors and gravity. Should always be positive."
                }
              >
                <MeasurementOutput
                  stateHook={[profiledTimeToGoal.acceleration, () => undefined]}
                  numberRoundTo={2}
                  defaultUnit="in/s2"
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Deceleration"
                id="decelTime"
                tooltip={
                  "The magnitude of acceleration the system experiences going downwards. " +
                  "Includes both motors and gravity. Should always be positive."
                }
              >
                <MeasurementOutput
                  stateHook={[profiledTimeToGoal.deceleration, () => undefined]}
                  numberRoundTo={2}
                  defaultUnit="in/s2"
                />
              </SingleInputLine>
            </Column>
          </Columns>
          <Columns formColumns>
            <Column>
              <SingleInputLine
                label="Accel Dist"
                id="accelDist"
                tooltip={
                  "The distance the system travels during the acceleration phase."
                }
              >
                <MeasurementOutput
                  stateHook={[
                    profiledTimeToGoal.accelDistance,
                    () => undefined,
                  ]}
                  numberRoundTo={2}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
            <Column>
              <SingleInputLine
                label="Decel Dist"
                id="decelDist"
                tooltip={
                  "The distance the system travels during the deceleration phase."
                }
              >
                <MeasurementOutput
                  stateHook={[
                    profiledTimeToGoal.decelDistance,
                    () => undefined,
                  ]}
                  numberRoundTo={2}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
          </Columns>
          <SingleInputLine
            label="Time to Goal"
            id="timeToGoal"
            tooltip="How long it takes the system to reach the travel distance."
          >
            <MeasurementOutput
              stateHook={[profiledTimeToGoal.smartTimeToGoal, () => undefined]}
              numberRoundTo={2}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Max Velocity"
            id="maxVelocity"
            tooltip="The highest velocity the system reaches during the motion profile."
          >
            <MeasurementOutput
              stateHook={[profiledTimeToGoal.maxVelocity, () => undefined]}
              numberRoundTo={2}
              defaultUnit="in/s"
            />
          </SingleInputLine>

          <Columns formColumns>
            <Column>
              <SingleInputLine
                label="Cruise Time"
                id="cruiseTime"
                tooltip="The duration the system is cruising at max velocity in the motion profile."
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
            <Column>
              <SingleInputLine
                label="Cruise Dist"
                id="cruiseDist"
                tooltip={
                  "The distance the system travels during the cruise phase."
                }
              >
                <MeasurementOutput
                  stateHook={[
                    profiledTimeToGoal.cruiseDistance,
                    () => undefined,
                  ]}
                  numberRoundTo={2}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <SingleInputLine
            label="System Acceleration"
            id="systemAcceleration"
            tooltip={
              "The acceleration the system experiences without any motor input. " +
              "This is positive if the system experiences an upwards acceleration, " +
              "or negative if the system experiences downwards acceleration (most common)."
            }
          >
            <MeasurementOutput
              stateHook={[
                profiledTimeToGoal.systemAcceleration,
                () => undefined,
              ]}
              numberRoundTo={2}
              defaultUnit="in/s2"
            />
          </SingleInputLine>

          <KgKvKaDisplay kG={kG} kV={kV} kA={kA} distanceType={"linear"} />
        </Column>
        <Column>
          <Graph
            options={linearGraphConfig}
            simpleDatasets={[
              GraphConfig.dataset(
                "Position (in)",
                chartData.position.filter((s) => s.y > 0),
                0,
                "y-position",
              ),
              GraphConfig.dataset(
                "Velocity (in/s)",
                chartData.velocity,
                1,
                "y-velocity",
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
