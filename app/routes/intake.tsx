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
  calculateLinearSurfaceSpeed,
  calculateRecommendedRatio,
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
};

export default function Intake() {
  const queryParams = useQueryParams<{
    motor: Motor;
    ratio: Ratio;
    rollerDiameter: Measurement;
    travelDistance: Measurement;
    drivetrainSpeed: Measurement;
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

  const recommendedRatio = useMemo(
    () => calculateRecommendedRatio(motor, drivetrainSpeed, rollerDiameter),
    [motor, drivetrainSpeed, rollerDiameter],
  );

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    motor,
    ratio,
    rollerDiameter,
    travelDistance,
    drivetrainSpeed,
  });

  return (
    <div>
      <CalcHeading
        title="Intake Calculator"
        getSerializedState={() => serializedState}
      />
      <div
        className="flex flex-col gap-4 px-1 md:flex-row md:gap-x-4 [&>*]:flex-1"
      >
        <div className="flex flex-col gap-x-4 gap-y-2">
          <IOLine>
            <MotorInput stateHook={[motor, setMotor]} />
          </IOLine>

          <IOLine>
            <RatioInput stateHook={[ratio, setRatio]} />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[rollerDiameter, setRollerDiameter]}
              label="Roller Diameter"
              tooltip="Diameter of the roller wheels/drum/etc that is moving the game piece."
            />
          </IOLine>

          <IOLine>
            <MeasurementInput
              stateHook={[travelDistance, setTravelDistance]}
              label="Travel Distance"
              tooltip="Distance the game piece is intended to travel across the intake."
            />
          </IOLine>

          <div className="my-4 border-t border-primary pt-4">
            <h3 className="mb-2 text-lg font-semibold">Reverse Calculation</h3>
          </div>

          <IOLine>
            <MeasurementInput
              stateHook={[drivetrainSpeed, setDrivetrainSpeed]}
              label="Drivetrain Speed"
              tooltip="The floor speed of your drivetrain."
            />
          </IOLine>

          <IOLine>
            <NumberOutput
              state={recommendedRatio.asNumber()}
              label="Recommended Reduction"
              roundTo={2}
            />
          </IOLine>
        </div>

        <div className="flex flex-col gap-x-4 gap-y-2">
          <IOLine>
            <MeasurementOutput
              state={surfaceSpeed}
              label="Linear Speed"
              tooltip="Surface speed of the wheels moving the game piece."
              defaultUnit="ft/s"
              roundTo={1}
            />
          </IOLine>

          <IOLine>
            <MeasurementOutput
              state={timeToGoal}
              label="Time to Goal"
              tooltip="Time required for the game piece to travel the distance specified."
              defaultUnit="s"
              roundTo={2}
            />
          </IOLine>
        </div>
      </div>
    </div>
  );
}
