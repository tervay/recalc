import { cn } from 'cn';
import { useCallback, useMemo, useState } from 'react';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import {
  MeasurementInput,
  MeasurementOutput,
} from '~/components/recalc/io/measurement';
import { MotorInput } from '~/components/recalc/io/motor';
import { RatioInput } from '~/components/recalc/io/ratio';
import { SwerveQuickSet } from '~/components/recalc/swerveQuickSet';
import { WheelTable } from '~/components/recalc/wheelTable';
import { Button } from '~/components/ui/button';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import {
  calculateAllRecommendedRatiosAndStallTorques,
  calculateLinearSurfaceSpeed,
} from '~/lib/math/intake';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import Wheel from '~/lib/models/Wheel';
import { buildMeta, pageUrl } from '~/lib/seo';
import {
  MeasurementParam,
  MotorParam,
  RatioParam,
} from '~/lib/types/queryParams';

const ROLLER_DIAMETER_TOLERANCE = new Measurement(0.1, 'in');

const INTAKE_PATH = '/intake';
const INTAKE_TITLE = 'FRC & FTC Intake Calculator | ReCalc';
const INTAKE_NAME = 'Intake Calculator';
const INTAKE_DESCRIPTION =
  'Calculate intake roller mechanisms for FRC and FTC robots. Model surface speed, motor requirements, and compression for game piece collection.';

export function meta() {
  return [
    ...buildMeta({
      path: INTAKE_PATH,
      title: INTAKE_TITLE,
      description: INTAKE_DESCRIPTION,
    }),
    {
      'script:ld+json': buildJsonLd(
        buildWebPage({
          url: pageUrl(INTAKE_PATH),
          name: INTAKE_NAME,
          description: INTAKE_DESCRIPTION,
          breadcrumbLabel: INTAKE_NAME,
        }),
        buildCalculatorApp({
          url: pageUrl(INTAKE_PATH),
          name: INTAKE_NAME,
          description: INTAKE_DESCRIPTION,
        }),
      ),
    },
  ];
}

const DEFAULT_PARAMS = {
  motor: MotorParam.withDefault(Motor.KrakenX60sFOC(1)),
  ratio: RatioParam.withDefault(new Ratio(1.5, RatioType.REDUCTION)),
  driveMotor: MotorParam.withDefault(Motor.KrakenX60(1)),
  rollerDiameter: MeasurementParam.withDefault(new Measurement(2, 'in')),
  travelDistance: MeasurementParam.withDefault(new Measurement(15, 'in')),
  drivetrainSpeed: MeasurementParam.withDefault(new Measurement(17.6, 'ft/s')),
  statorCurrentLimit: MeasurementParam.withDefault(new Measurement(30, 'A')),
};

export default function Intake() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [motor, setMotor] = useState(queryParams.motor);
  const [ratio, setRatio] = useState(queryParams.ratio);
  const [driveMotor, setDriveMotor] = useState(queryParams.driveMotor);
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
      motor,
      statorCurrentLimit,
    );
  }, [drivetrainSpeed, rollerDiameter, motor, statorCurrentLimit]);

  const wheelFilter = useCallback(
    (wheel: Wheel) =>
      wheel.diameter.sub(rollerDiameter).abs().lte(ROLLER_DIAMETER_TOLERANCE),
    [rollerDiameter],
  );

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    motor,
    ratio,
    driveMotor,
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
        <div className="flex min-w-75 flex-1 flex-col">
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
              <SwerveQuickSet
                driveMotorStateHook={[driveMotor, setDriveMotor]}
                drivetrainSpeedStateHook={[drivetrainSpeed, setDrivetrainSpeed]}
              />
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
              <div className="flex flex-col">
                <div className="flex items-center gap-3 px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <span className="flex-1">Motor</span>
                  <span className="w-14 text-right">Ratio</span>
                  <span className="w-24 text-right">Stall Torque</span>
                  <span className="w-14" />
                </div>
                {allRecommendedRatiosAndStallTorques
                  .sort((a, b) => b.stallTorque.sub(a.stallTorque).baseScalar)
                  .map((rts) => {
                    const selected = rts.motor.eq(motor);
                    return (
                      <div
                        key={rts.motor.identifier}
                        className={cn(
                          'flex items-center gap-3 rounded-md border px-2 py-1 text-sm transition-colors',
                          selected
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-transparent',
                        )}
                      >
                        <span className="flex-1 truncate font-medium">
                          {rts.motor.identifier}
                        </span>
                        <span
                          className="w-14 text-right text-muted-foreground tabular-nums"
                          data-testid={`${rts.motor.identifier}-ratio`}
                        >
                          {rts.ratio.asNumber().toFixed(2)}
                        </span>
                        <span
                          className="w-24 text-right text-muted-foreground tabular-nums"
                          data-testid={`${rts.motor.identifier}-stallTorque`}
                        >
                          {rts.stallTorque.to('N*m').scalar.toFixed(2)} N*m
                        </span>
                        <Button
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 w-14 shrink-0 cursor-pointer px-0"
                          data-testid={`${rts.motor.identifier}-set`}
                          onClick={() => {
                            setMotor(rts.motor);
                            setRatio(
                              new Ratio(
                                Number(rts.ratio.asNumber().toFixed(2)),
                                RatioType.REDUCTION,
                              ),
                            );
                          }}
                        >
                          Set
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-y-2">
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

          <WheelTable filterFn={wheelFilter} />
        </div>
      </div>
    </div>
  );
}
