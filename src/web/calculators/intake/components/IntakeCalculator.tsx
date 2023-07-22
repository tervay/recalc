import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  MeasurementInput,
  MotorInput,
  RatioInput,
} from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import NumberOutput from "common/components/io/outputs/NumberOutput";
import { Column, Columns, Divider } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import { useGettersSetters } from "common/tooling/conversion";
import { useMemo } from "react";
import { IntakeParamsV1, IntakeStateV1 } from "web/calculators/intake";
import { IntakeState } from "web/calculators/intake/converter";
import {
  calculateLinearSurfaceSpeed,
  calculateRecommendedRatio,
} from "web/calculators/intake/math";

export default function IntakeCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(IntakeState.getState() as IntakeStateV1);

  const surfaceSpeed = useMemo(
    () => calculateLinearSurfaceSpeed(get.motor, get.ratio, get.rollerDiameter),
    [get.motor, get.ratio, get.rollerDiameter],
  );
  const timeToGoal = useMemo(
    () =>
      surfaceSpeed.eq(new Measurement(0, "ft/s"))
        ? new Measurement(0, "s")
        : get.travelDistance.div(surfaceSpeed),
    [get.travelDistance, surfaceSpeed],
  );
  const recommendedRatio = useMemo(
    () =>
      calculateRecommendedRatio(
        get.motor,
        get.drivetrainSpeed,
        get.rollerDiameter,
      ),
    [get.motor, get.drivetrainSpeed, get.rollerDiameter],
  );

  return (
    <>
      <SimpleHeading
        queryParams={IntakeParamsV1}
        state={get}
        title="Intake Calculator"
      />

      <Columns desktop centered>
        <Column>
          <SingleInputLine label="Motor" id="motor">
            <MotorInput stateHook={[get.motor, set.setMotor]} />
          </SingleInputLine>
          <SingleInputLine
            label="Ratio"
            id="ratio"
            tooltip="The ratio between the motors and the intake wheel(s)."
          >
            <RatioInput stateHook={[get.ratio, set.setRatio]} />
          </SingleInputLine>

          <SingleInputLine
            label="Roller Diameter"
            id="rollerDiameter"
            tooltip="Diameter of the roller wheels/drum/etc that is moving the game piece."
          >
            <MeasurementInput
              stateHook={[get.rollerDiameter, set.setRollerDiameter]}
            />
          </SingleInputLine>

          <SingleInputLine
            label="Travel Distance"
            id="travelDistance"
            tooltip="Distance the game piece is intended to travel across the intake."
          >
            <MeasurementInput
              stateHook={[get.travelDistance, set.setTravelDistance]}
            />
          </SingleInputLine>

          <Divider color="primary">Reverse Calculation</Divider>

          <SingleInputLine
            label="Drivetrain Speed"
            id="drivetrainSpeed"
            tooltip="The floor speed of your drivetrain."
          >
            <MeasurementInput
              stateHook={[get.drivetrainSpeed, set.setDrivetrainSpeed]}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Recommended Reduction"
            id="recommendedRatio"
            tooltip="The reduction required for the surface speed of the intake wheels to be twice that of the ground speed of the drivetrain."
          >
            <NumberOutput
              stateHook={[recommendedRatio.asNumber(), () => undefined]}
              roundTo={2}
            />
          </SingleInputLine>
        </Column>

        <Column>
          <SingleInputLine
            label="Linear Speed"
            id="linearSpeed"
            tooltip="Surface speed of the wheels moving the game piece."
          >
            <MeasurementOutput
              stateHook={[surfaceSpeed, () => undefined]}
              defaultUnit="ft/s"
              numberRoundTo={1}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Time to Goal"
            id="timeToGoal"
            tooltip="Time required for the game piece to travel the distance specified."
          >
            <MeasurementOutput
              stateHook={[timeToGoal, () => undefined]}
              defaultUnit="s"
              numberRoundTo={2}
            />
          </SingleInputLine>
        </Column>
      </Columns>
    </>
  );
}
