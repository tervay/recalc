import { solveMotorODE } from '~/lib/math/ode';
import Measurement, { type MeasurementDict } from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import { arrayToVectorDouble } from '~/lib/wpilib/util';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

export interface LinearODEResult {
  positionInches: number;
  velocityRPM: number;
  statorDrawAmps: number;
  timeSeconds: number;
  powerWatts: number;
  efficiency: number;
}

const wpilibc = await initWpilibc();
const SIM_TIMESTEP_SECONDS = 0.01;

export function generateODEData(
  motor_: MotorDict,
  statorVoltage_: MeasurementDict,
  supplyVoltage_: MeasurementDict,
  statorLimit_: MeasurementDict,
  supplyLimit_: MeasurementDict,
  travelDistance_: MeasurementDict,
  ratio_: RatioDict,
  spoolDiameter_: MeasurementDict,
  load_: MeasurementDict,
  J_: MeasurementDict,
  efficiency: number,
  angle_: MeasurementDict,
): LinearODEResult[] {
  const statorVoltage = Measurement.fromDict(statorVoltage_);
  const supplyVoltage = Measurement.fromDict(supplyVoltage_);
  const motor = Motor.fromDict(motor_);
  const statorLimit = Measurement.fromDict(statorLimit_);
  const supplyLimit = Measurement.fromDict(supplyLimit_);
  const travelDistance = Measurement.fromDict(travelDistance_);
  const spoolDiameter = Measurement.fromDict(spoolDiameter_);
  const ratio = Ratio.fromDict(ratio_);
  const load = Measurement.fromDict(load_);
  const J = Measurement.fromDict(J_);
  const angle = Measurement.fromDict(angle_);

  if (
    [
      ratio.magnitude,
      spoolDiameter.baseScalar,
      statorLimit.baseScalar,
      supplyLimit.baseScalar,
    ].includes(0)
  ) {
    return [];
  }

  const gravitationalForce = load.mul(Measurement.GRAVITY.negate());
  const gravitationalTorque = gravitationalForce
    .mul(spoolDiameter.div(2))
    .div(ratio.asNumber())
    .mul(Math.sin(angle.to('rad').scalar));

  const data = solveMotorODE(
    motor,
    statorVoltage,
    supplyVoltage,
    supplyLimit,
    statorLimit,
    (info) =>
      info.position
        .linearizeRadialPosition(
          spoolDiameter.mul(Math.PI).div(ratio.asNumber()),
        )
        .gte(travelDistance) ||
      (info.velocity.lte(new Measurement(2, 'rad/s')) &&
        info.stepNumber >= 1000),
    J,
    gravitationalTorque,
    efficiency,
  );

  const ret: LinearODEResult[] = [];

  data.forEach((d) => {
    ret.push({
      positionInches: d.positionRad.linearizeRadialPosition(
        spoolDiameter.mul(Math.PI).div(ratio.asNumber()),
      ).scalar,
      velocityRPM: d.velocityRPM.to('rpm').scalar,
      statorDrawAmps: d.statorDrawAmps.to('A').scalar,
      timeSeconds: d.time.to('s').scalar,
      powerWatts: d.power.to('W').scalar,
      efficiency: d.efficiency * 100,
    });
  });

  return ret;
}

interface WpilibElevatorSimState {
  positionMeters: number;
  velocityMetersPerSecond: number;
  currentDrawAmps: number;
  timeSeconds: number;
  batteryVoltageVolts: number;
}

export function simulateElevatorWpilib(
  motor: MotorDict,
  ratio: RatioDict,
  load: MeasurementDict,
  spoolDiameter: MeasurementDict,
  travelDistance: MeasurementDict,
  _currentLimitDict: MeasurementDict,
): WpilibElevatorSimState[] {
  const states: WpilibElevatorSimState[] = [];

  const elevatorSim = new wpilibc.ElevatorSim(
    Motor.fromDict(motor).toWpilibMotor(),
    Ratio.fromDict(ratio).asNumber(),
    Measurement.fromDict(load).to('kg').scalar,
    Measurement.fromDict(spoolDiameter).div(2).to('m').scalar,
    0, // min height
    Measurement.fromDict(travelDistance).to('m').scalar,
    true,
    0, // starting height
  );

  let timestamp = 0;
  while (
    elevatorSim.getPosition() <
    Measurement.fromDict(travelDistance).to('m').scalar
  ) {
    elevatorSim.setInputVoltage(wpilibc.RobotController_getInputVoltage());
    elevatorSim.update(SIM_TIMESTEP_SECONDS);
    timestamp += SIM_TIMESTEP_SECONDS;

    states.push({
      positionMeters: elevatorSim.getPosition(),
      velocityMetersPerSecond: elevatorSim.getVelocity(),
      currentDrawAmps: elevatorSim.getCurrentDraw(),
      timeSeconds: parseFloat(timestamp.toFixed(2)),
      batteryVoltageVolts: wpilibc.BatterySim_calculateLoadedBatteryVoltage(
        12,
        0.015,
        arrayToVectorDouble([elevatorSim.getCurrentDraw()]),
      ),
    });

    wpilibc.RoboRioSim_setVInVoltage(
      wpilibc.BatterySim_calculateLoadedBatteryVoltage(
        12,
        0.015,
        arrayToVectorDouble([elevatorSim.getCurrentDraw()]),
      ),
    );

    if (timestamp > 5) {
      break;
    }
  }

  return states;
}
