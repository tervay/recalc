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
import { DriveStateV1 } from "web/calculators/drive";
import { DriveState } from "web/calculators/drive/converter";
import { DriveWorkerFunctions, IliteResult } from "web/calculators/drive/math";
import rawWorker from "web/calculators/drive/math?worker";

const worker = await wrap<DriveWorkerFunctions>(new rawWorker());

export default function DriveCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(DriveState.getState() as DriveStateV1);

  const output = useAsyncMemo<IliteResult | undefined>(
    undefined,
    async () =>
      worker
        .iliteSim({
          swerve_: get.swerve,
          motor_: get.motor.toDict(),
          ratio_: get.ratio.toDict(),
          efficiency_: get.efficiency,
          weightInspected_: get.weightInspected.toDict(),
          weightAuxilliary_: get.weightAuxilliary.toDict(),
          wheelDiameter_: get.wheelDiameter.toDict(),
          wheelCOFStatic_: get.wheelCOFStatic,
          wheelCOFDynamic_: get.wheelCOFDynamic,
          wheelCOFLateral_: get.wheelCOFLateral,
          wheelBaseLength_: get.wheelBaseLength.toDict(),
          wheelBaseWidth_: get.wheelBaseWidth.toDict(),
          weightDistributionFrontBack_: get.weightDistributionFrontBack,
          weightDistributionLeftRight_: get.weightDistributionLeftRight,
          sprintDistance_: get.sprintDistance.toDict(),
          targetTimeToGoal_: get.targetTimeToGoal.toDict(),
          numCyclesPerMatch_: get.numCyclesPerMatch,
          batteryVoltageAtRest_: get.batteryVoltageAtRest.toDict(),
          appliedVoltageRamp_: get.appliedVoltageRamp.toDict(),
          motorCurrentLimit_: get.motorCurrentLimit.toDict(),
          batteryResistance_: get.batteryResistance.toDict(),
          batteryAmpHours_: get.batteryAmpHours.toDict(),
          peakBatteryDischarge_: get.peakBatteryDischarge,
          maxSimulationTime_: get.maxSimulationTime.toDict(),
          gearRatioMin_: get.gearRatioMin.toDict(),
          gearRatioMax_: get.gearRatioMax.toDict(),
          filtering_: get.filtering,
          maxSpeedAccelerationThreshold_:
            get.maxSpeedAccelerationThreshold.toDict(),
          throttleResponseMin_: get.throttleResponseMin,
          throttleResponseMax_: get.throttleResponseMax,
        })
        .then((rd) => ({
          maxVelocity: Measurement.fromDict(rd.maxVelocity),
          maxTractiveForce: Measurement.fromDict(rd.maxTractiveForce),
          outputCurrentAtMaxTractiveForce: Measurement.fromDict(
            rd.outputCurrentAtMaxTractiveForce,
          ),
          voltageAtMaxTractiveForce: Measurement.fromDict(
            rd.voltageAtMaxTractiveForce,
          ),
          maxTheoreticalSpeed: Measurement.fromDict(rd.maxTheoreticalSpeed),
        })),
    [
      get.swerve,
      get.motor.quantity,
      get.ratio.asNumber(),
      get.efficiency,
      get.weightInspected,
      get.weightAuxilliary,
      get.wheelDiameter,
      get.wheelCOFStatic,
      get.wheelCOFDynamic,
      get.wheelCOFLateral,
      get.wheelBaseLength,
      get.wheelBaseWidth,
      get.weightDistributionFrontBack,
      get.weightDistributionLeftRight,
      get.sprintDistance,
      get.targetTimeToGoal,
      get.numCyclesPerMatch,
      get.batteryVoltageAtRest,
      get.appliedVoltageRamp,
      get.motorCurrentLimit,
      get.batteryResistance,
      get.batteryAmpHours,
      get.peakBatteryDischarge,
      get.maxSimulationTime,
      get.gearRatioMin,
      get.gearRatioMax,
      get.filtering,
      get.maxSpeedAccelerationThreshold,
      get.throttleResponseMin,
      get.throttleResponseMax,
    ],
  );

  return (
    <>
      <Columns>
        <Column>
          <SingleInputLine label="Swerve?">
            <BooleanInput stateHook={[get.swerve, set.setSwerve]} />
          </SingleInputLine>
          <SingleInputLine label="Motors">
            <MotorInput stateHook={[get.motor, set.setMotor]} />
          </SingleInputLine>
          <SingleInputLine label="Ratio">
            <RatioInput stateHook={[get.ratio, set.setRatio]} />
          </SingleInputLine>
          <SingleInputLine label="Efficiency">
            <NumberInput stateHook={[get.efficiency, set.setEfficiency]} />
          </SingleInputLine>
          <SingleInputLine label="Inspected Weight">
            <MeasurementInput
              stateHook={[get.weightInspected, set.setWeightInspected]}
            />
          </SingleInputLine>
          <SingleInputLine label="Auxilliary Weight">
            <MeasurementInput
              stateHook={[get.weightAuxilliary, set.setWeightAuxilliary]}
            />
          </SingleInputLine>
          <SingleInputLine label="Wheel Diameter">
            <MeasurementInput
              stateHook={[get.wheelDiameter, set.setWheelDiameter]}
            />
          </SingleInputLine>
          <SingleInputLine label="COF (Static)">
            <NumberInput
              stateHook={[get.wheelCOFStatic, set.setWheelCOFStatic]}
            />
          </SingleInputLine>
          <SingleInputLine label="COF (Dynamic)">
            <NumberInput
              stateHook={[get.wheelCOFDynamic, set.setWheelCOFDynamic]}
            />
          </SingleInputLine>
          <SingleInputLine label="COF (Lateral)">
            <NumberInput
              stateHook={[get.wheelCOFLateral, set.setWheelCOFLateral]}
            />
          </SingleInputLine>
          {!get.swerve && (
            <>
              <SingleInputLine label="Wheel Base Length">
                <MeasurementInput
                  stateHook={[get.wheelBaseLength, set.setWheelBaseLength]}
                />
              </SingleInputLine>
              <SingleInputLine label="Wheel Base Width">
                <MeasurementInput
                  stateHook={[get.wheelBaseWidth, set.setWheelBaseWidth]}
                />
              </SingleInputLine>
              <SingleInputLine label="Weight Distribution (front/rear)">
                <NumberInput
                  stateHook={[
                    get.weightDistributionFrontBack,
                    set.setWeightDistributionFrontBack,
                  ]}
                />
              </SingleInputLine>
              <SingleInputLine label="Weight Distribution (left/right)">
                <NumberInput
                  stateHook={[
                    get.weightDistributionLeftRight,
                    set.setWeightDistributionLeftRight,
                  ]}
                />
              </SingleInputLine>
            </>
          )}
          <SingleInputLine label="Sprint Distance">
            <MeasurementInput
              stateHook={[get.sprintDistance, set.setSprintDistance]}
            />
          </SingleInputLine>
          <SingleInputLine label="Target Time to Goal">
            <MeasurementInput
              stateHook={[get.targetTimeToGoal, set.setTargetTimeToGoal]}
            />
          </SingleInputLine>
          <SingleInputLine label="# Cycles per Match">
            <NumberInput
              stateHook={[get.numCyclesPerMatch, set.setNumCyclesPerMatch]}
            />
          </SingleInputLine>
          <SingleInputLine label="Battery Voltage at Rest">
            <MeasurementInput
              stateHook={[
                get.batteryVoltageAtRest,
                set.setBatteryVoltageAtRest,
              ]}
            />
          </SingleInputLine>
          <SingleInputLine label="Applied Voltage Ramp">
            <MeasurementInput
              stateHook={[get.appliedVoltageRamp, set.setAppliedVoltageRamp]}
            />
          </SingleInputLine>
          <SingleInputLine label="Motor Current Limit">
            <MeasurementInput
              stateHook={[get.motorCurrentLimit, set.setMotorCurrentLimit]}
            />
          </SingleInputLine>
          <SingleInputLine label="Battery Resistance">
            <MeasurementInput
              stateHook={[get.batteryResistance, set.setBatteryResistance]}
            />
          </SingleInputLine>
          <SingleInputLine label="Battery Amp Hours">
            <MeasurementInput
              stateHook={[get.batteryAmpHours, set.setBatteryAmpHours]}
            />
          </SingleInputLine>
          <SingleInputLine label="Peak Battery Discharge C-Rating">
            <NumberInput
              stateHook={[
                get.peakBatteryDischarge,
                set.setPeakBatteryDischarge,
              ]}
            />
          </SingleInputLine>
        </Column>
        <Column>
          {output !== undefined && (
            <>
              <SingleInputLine label="Max Tractive Force">
                <MeasurementOutput
                  stateHook={[output.maxTractiveForce, () => {}]}
                  numberRoundTo={2}
                  defaultUnit="lbf"
                />
              </SingleInputLine>
              <SingleInputLine label="Current at Max Traction">
                <MeasurementOutput
                  stateHook={[output.outputCurrentAtMaxTractiveForce, () => {}]}
                  numberRoundTo={2}
                  defaultUnit="A"
                />
              </SingleInputLine>
              <SingleInputLine label="Voltage at Max Traction">
                <MeasurementOutput
                  stateHook={[output.voltageAtMaxTractiveForce, () => {}]}
                  numberRoundTo={2}
                  defaultUnit="V"
                  warningIf={() =>
                    output.voltageAtMaxTractiveForce.lte(
                      new Measurement(6.8, "V"),
                    )
                  }
                  dangerIf={() =>
                    output.voltageAtMaxTractiveForce.lte(
                      new Measurement(6.3, "V"),
                    )
                  }
                />
              </SingleInputLine>
              <SingleInputLine label="Max Theoretical Speed">
                <MeasurementOutput
                  stateHook={[output.maxTheoreticalSpeed, () => {}]}
                  numberRoundTo={2}
                  defaultUnit="ft/s"
                />
              </SingleInputLine>
            </>
          )}
        </Column>
      </Columns>
    </>
  );
}
