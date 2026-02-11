import { useMemo, useState } from 'react';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import {
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import { MotorInput } from '~/components/recalc/io/motor';
import { NumberOutput } from '~/components/recalc/io/number';
import { RatioInput } from '~/components/recalc/io/ratio';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import {
  calculateAllRecommendedRatiosAndStallTorques,
  calculateLinearSurfaceSpeed,
} from '~/lib/math/intake';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import {
  MeasurementParam,
  MotorParam,
  RatioParam,
  withDefault,
} from '~/lib/types/queryParams';
import { cn } from '~/lib/utils';

export function meta() {
  return [
    { title: 'Intake Calculator' },
    { name: 'description', content: 'Intake Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  motor: withDefault(MotorParam, Motor.KrakenX60sFOC(1)),
  ratio: withDefault(RatioParam, new Ratio(2, RatioType.REDUCTION)),
  rollerDiameter: withDefault(MeasurementParam, new Measurement(2, 'in')),
  travelDistance: withDefault(MeasurementParam, new Measurement(15, 'in')),
  drivetrainSpeed: withDefault(MeasurementParam, new Measurement(14, 'ft/s')),
  statorCurrentLimit: withDefault(MeasurementParam, new Measurement(30, 'A')),
};

export default function Intake() {
  const queryParams = useQueryParams<{
    motor: Motor;
    ratio: Ratio;
    rollerDiameter: Measurement;
    travelDistance: Measurement;
    drivetrainSpeed: Measurement;
    statorCurrentLimit: Measurement;
  }>(DEFAULT_PARAMS);

  const [motor, setMotor] = useState(queryParams.motor);
  const [ratio, setRatio] = useState(queryParams.ratio);
  const [rollerDiameter, setRollerDiameter] = useState(
    queryParams.rollerDiameter,
  );
  const [travelDistance, setTravelDistance] = useState(
    queryParams.travelDistance,
  );
  const [drivetrainSpeed, setDrivetrainSpeed] = useState(
    queryParams.drivetrainSpeed,
  );
  const [statorCurrentLimit, setStatorCurrentLimit] = useState(
    queryParams.statorCurrentLimit,
  );

  const surfaceSpeed = useMemo(
    () => calculateLinearSurfaceSpeed(motor, ratio, rollerDiameter),
    [motor, ratio, rollerDiameter],
  );

  const timeToGoal = useMemo(() => {
    if (surfaceSpeed.scalar === 0) {
      return new Measurement(0, 's');
    }
    return travelDistance.div(surfaceSpeed);
  }, [travelDistance, surfaceSpeed]);

  const allRecommendedRatiosAndStallTorques = useMemo(() => {
    return calculateAllRecommendedRatiosAndStallTorques(
      drivetrainSpeed,
      rollerDiameter,
      motor.quantity,
      statorCurrentLimit,
    );
  }, [drivetrainSpeed, rollerDiameter, motor.quantity, statorCurrentLimit]);

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    motor,
    ratio,
    rollerDiameter,
    travelDistance,
    drivetrainSpeed,
    statorCurrentLimit,
  });

  return (
    <div>
      <CalcHeading
        title="Intake Calculator"
        getSerializedState={() => serializedState}
      />
      <div className="flex flex-col gap-4 px-1 *:flex-1 md:flex-row md:gap-x-4">
        <div className="flex flex-col gap-x-4 gap-y-2">
          <IOLine>
            <MotorInput stateHook={[motor, setMotor]} testId="motor" />
          </IOLine>

          <IOLine>
            <RatioInput stateHook={[ratio, setRatio]} testId="ratio" />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[rollerDiameter, setRollerDiameter]}
              label="Roller Diameter"
              tooltip="Diameter of the roller wheels/drum/etc that is moving the game piece."
              testId="rollerDiameter"
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[travelDistance, setTravelDistance]}
              label="Travel Distance"
              tooltip="Distance the game piece is intended to travel across the intake."
              testId="travelDistance"
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[statorCurrentLimit, setStatorCurrentLimit]}
              label="Stator Current Limit"
              tooltip="The maximum current the stator can draw."
              testId="statorCurrentLimit"
            />
          </IOLine>

          <div className="border-t border-primary pt-4">
            <h3 className="text-lg font-semibold">Reverse Calculation</h3>
          </div>

          <IOLine>
            <MeasurementInput
              stateHook={[drivetrainSpeed, setDrivetrainSpeed]}
              label="Drivetrain Speed"
              tooltip="The floor speed of your drivetrain."
              testId="drivetrainSpeed"
            />
          </IOLine>

          <div className="">
            <h3 className="text-lg font-semibold">
              Recommended Ratios per Motor
            </h3>
            <h6 className="mb-2 text-sm text-gray-500">
              The recommended ratio is the ratio at which the rollers will spin
              at twice the drivetrain speed.
            </h6>
            <div className="flex flex-col gap-y-2">
              {allRecommendedRatiosAndStallTorques
                .sort((a, b) => b.stallTorque.sub(a.stallTorque).baseScalar)
                .map((rts) => (
                  <IOLine
                    key={rts.motor.identifier}
                    className={cn({
                      'rounded-md border border-green-400 px-2 py-2':
                        rts.motor.eq(motor),
                    })}
                  >
                    <NumberOutput
                      state={rts.ratio.asNumber()}
                      label={`${rts.motor.identifier}`}
                      roundTo={2}
                      testId={`${rts.motor.identifier}-ratio`}
                    />
                    <MeasurementOutput
                      state={rts.stallTorque}
                      label="Stall Torque"
                      tooltip="Stall torque of the motor at the recommended ratio."
                      defaultUnit="N*m"
                      roundTo={2}
                      testId={`${rts.motor.identifier}-stallTorque`}
                    />
                  </IOLine>
                ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-x-4 gap-y-2">
          <IOLine>
            <MeasurementOutput
              state={surfaceSpeed}
              label="Linear Speed"
              tooltip="Surface speed of the wheels moving the game piece."
              defaultUnit="ft/s"
              roundTo={1}
              testId="surfaceSpeed"
            />
          </IOLine>

          <IOLine>
            <MeasurementOutput
              state={timeToGoal}
              label="Time to Goal"
              tooltip="Time required for the game piece to travel the distance specified."
              defaultUnit="s"
              roundTo={2}
              testId="timeToGoal"
            />
          </IOLine>
        </div>
      </div>
    </div>
  );
}
