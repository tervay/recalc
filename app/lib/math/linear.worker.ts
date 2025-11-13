import Measurement, { type MeasurementDict } from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import type { RatioDict } from '~/lib/models/Ratio';
import Ratio from '~/lib/models/Ratio';
import { obliterateArray } from '~/lib/utils';
import { arrayToVectorDouble } from '~/lib/wpilib/util';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

const SIM_TIMESTEP_SECONDS = 0.001;

export interface WpilibElevatorSimState {
  positionMeters: number;
  velocityMetersPerSecond: number;
  statorCurrentDrawAmps: number;
  supplyCurrentDrawAmps: number;
  timeSeconds: number;
  batteryVoltageVolts: number;
  motorAppliedVoltageVolts: number;
  motorRpm: number;
}

export async function simulateElevatorWpilib(
  motor: MotorDict,
  ratio: RatioDict,
  load: MeasurementDict,
  spoolDiameter: MeasurementDict,
  travelDistance: MeasurementDict,
  currentLimitDict: MeasurementDict,
  statorVoltageDict: MeasurementDict,
  batteryResistance: MeasurementDict,
  batteryVoltage: MeasurementDict,
): Promise<WpilibElevatorSimState[]> {
  const wpilibc = await initWpilibc();

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

  const statorVoltage = Measurement.fromDict(statorVoltageDict);
  const iMax = Measurement.fromDict(currentLimitDict).mul(motor.quantity);
  let vApplied = statorVoltage;
  const resistance = new Measurement(
    Motor.fromDict(motor).toWpilibMotor().getROhms(),
    'Ohm',
  );

  wpilibc.RoboRioSim_setVInVoltage(
    Measurement.fromDict(batteryVoltage).to('V').scalar,
  );

  let timestamp = 0;

  while (
    elevatorSim.getPosition() <
    Measurement.fromDict(travelDistance).to('m').scalar
  ) {
    vApplied = statorVoltage;

    const w = new Measurement(elevatorSim.getVelocity(), 'm/s')
      .div(Measurement.fromDict(spoolDiameter).div(2))
      .mul(Ratio.fromDict(ratio).asNumber())
      .mul(new Measurement(1, 'rad'));

    const vBackEmf = Motor.fromDict(motor).kV.inverse().mul(w);

    vApplied = Measurement.max(
      vBackEmf.sub(iMax.mul(resistance)),
      Measurement.min(vApplied, vBackEmf.add(iMax.mul(resistance))),
    );

    // vApplied = Measurement.min(
    //   vApplied,
    //   new Measurement(wpilibc.RobotController_getInputVoltage(), 'V'),
    // );

    elevatorSim.setInputVoltage(vApplied.to('V').scalar);
    elevatorSim.update(SIM_TIMESTEP_SECONDS);
    timestamp += SIM_TIMESTEP_SECONDS;

    const statorCurrent = new Measurement(elevatorSim.getCurrentDraw(), 'A');
    const supplyCurrent = statorCurrent
      .mul(vApplied)
      .div(new Measurement(wpilibc.RobotController_getInputVoltage(), 'V'));

    if (!elevatorSim.hasHitUpperLimit()) {
      states.push({
        positionMeters: elevatorSim.getPosition(),
        velocityMetersPerSecond: elevatorSim.getVelocity(),
        statorCurrentDrawAmps: statorCurrent.to('A').scalar,
        supplyCurrentDrawAmps: supplyCurrent.to('A').scalar,
        timeSeconds: parseFloat(timestamp.toFixed(3)),
        batteryVoltageVolts: wpilibc.BatterySim_calculateLoadedBatteryVoltage(
          Measurement.fromDict(batteryVoltage).to('V').scalar,
          Measurement.fromDict(batteryResistance).to('Ohm').scalar,
          arrayToVectorDouble([supplyCurrent.to('A').scalar]),
        ),
        motorAppliedVoltageVolts: vApplied.to('V').scalar,
        motorRpm: w.to('rpm').scalar,
      });
    }

    // wpilibc.RoboRioSim_setVInVoltage(
    //   wpilibc.BatterySim_calculateLoadedBatteryVoltage(
    //     12,
    //     0.015,
    //     arrayToVectorDouble([supplyCurrent.to('A').scalar]),
    //   ),
    // );

    if (timestamp > 5) {
      break;
    }
  }

  return obliterateArray(states, 10);
}
