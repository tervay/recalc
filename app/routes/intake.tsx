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
} from '~/lib/types/queryParams';
import { cn } from '~/lib/utils';

export function meta() {
  return [
    { title: 'Intake Calculator' },
    { name: 'description', content: 'Intake Calculator' },
  ];
}

const DEFAULT_PARAMS = {
  motor: MotorParam.withDefault(Motor.KrakenX60sFOC(1)),
  ratio: RatioParam.withDefault(new Ratio(2, RatioType.REDUCTION)),
  rollerDiameter: MeasurementParam.withDefault(new Measurement(2, 'in')),
  travelDistance: MeasurementParam.withDefault(new Measurement(15, 'in')),
  drivetrainSpeed: MeasurementParam.withDefault(new Measurement(14, 'ft/s')),
  statorCurrentLimit: MeasurementParam.withDefault(new Measurement(30, 'A')),
};

export default function Intake() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

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
      <div className="flex flex-row flex-wrap gap-6 px-1">
        <div className="flex min-w-[300px] flex-1 flex-col">
          <section className="flex flex-col rounded-lg border">
            {/* Motor & Gearing section */}
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Motor &amp; Gearing
              </h2>
              <IOLine>
                <MotorInput
                  stateHook={[motor, setMotor]}
                  testId="motor"
                  labelAbove
                />
              </IOLine>
              <IOLine>
                <RatioInput
                  stateHook={[ratio, setRatio]}
                  testId="ratio"
                  labelAbove
                />
              </IOLine>
            </div>
            <div className="border-t" />

            {/* Roller section */}
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Roller
              </h2>
              <IOLine>
                <MeasurementInput
                  stateHook={[rollerDiameter, setRollerDiameter]}
                  label="Roller Diameter"
                  tooltip="Diameter of the roller wheels/drum/etc that is moving the game piece."
                  testId="rollerDiameter"
                  labelAbove
                />
                <MeasurementInput
                  stateHook={[travelDistance, setTravelDistance]}
                  label="Travel Distance"
                  tooltip="Distance the game piece is intended to travel across the intake."
                  testId="travelDistance"
                  labelAbove
                />
              </IOLine>
              <IOLine>
                <MeasurementInput
                  stateHook={[statorCurrentLimit, setStatorCurrentLimit]}
                  label="Stator Current Limit"
                  tooltip="The maximum current the stator can draw."
                  testId="statorCurrentLimit"
                  labelAbove
                />
              </IOLine>
            </div>
            <div className="border-t" />

            {/* Reverse Calculation section */}
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Reverse Calculation
              </h2>
              <IOLine>
                <MeasurementInput
                  stateHook={[drivetrainSpeed, setDrivetrainSpeed]}
                  label="Drivetrain Speed"
                  tooltip="The floor speed of your drivetrain."
                  testId="drivetrainSpeed"
                  labelAbove
                />
              </IOLine>
            </div>
            <div className="border-t" />

            {/* Recommended Ratios section */}
            <div className="flex flex-col gap-3 p-4">
              <div>
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Recommended Ratios per Motor
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The recommended ratio is the ratio at which the rollers will
                  spin at twice the drivetrain speed.
                </p>
              </div>
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
          </section>
        </div>

        <div className="flex min-w-[300px] flex-1 flex-col gap-y-2">
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
