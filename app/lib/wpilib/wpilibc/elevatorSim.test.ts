import { beforeAll, describe, expect, it } from 'vitest';

import type { MainModule } from '~/lib/generated/wpilibc/wpilibc_wasm';
import Measurement from '~/lib/models/Measurement';
import Motor from '~/lib/models/Motor';
import Ratio, { RatioType } from '~/lib/models/Ratio';
import { arrayToVectorDouble } from '~/lib/wpilib/util';
import { getWpilibcModule, getWpilibcModuleSync } from '~/lib/wpilib/wpilibc';

describe('ElevatorSim', () => {
  let _module: MainModule;

  beforeAll(async () => {
    _module = await getWpilibcModule();
  });

  it('should create a DCMotor sim', () => {
    const motor = Motor.KrakenX60(1);
    const wpilibMotor = motor.toWpilibMotor();
    expect(wpilibMotor.getKtNMPerAmp()).toBeCloseTo(motor.kT.scalar, 5);
  });

  it('should create an ElevatorSim', () => {
    getWpilibcModuleSync().RoboRioSim_setVInVoltage(12);
    const motor = Motor.KrakenX60(1);
    const elevatorSim = new _module.ElevatorSim(
      motor.toWpilibMotor(),
      new Ratio(5, RatioType.REDUCTION).asNumber(),
      new Measurement(3, 'lb').to('kg').scalar,
      new Measurement(1, 'in').to('m').scalar,
      new Measurement(0, 'in').to('m').scalar,
      new Measurement(100, 'in').to('m').scalar,
      false,
      new Measurement(0, 'in').to('m').scalar,
    );

    expect(elevatorSim.getPosition()).toBe(0);
    expect(elevatorSim.getVelocity()).toBe(0);
    expect(elevatorSim.getCurrentDraw()).toBe(0);
    expect(elevatorSim.hasHitLowerLimit()).toBe(true);
    expect(elevatorSim.hasHitUpperLimit()).toBe(false);

    let timestamp = 0;
    while (timestamp < 1) {
      elevatorSim.setInputVoltage(
        0.5 * getWpilibcModuleSync().RobotController_getInputVoltage(),
      );
      getWpilibcModuleSync().RoboRioSim_setVInVoltage(
        getWpilibcModuleSync().BatterySim_calculateDefaultBatteryLoadedVoltage(
          arrayToVectorDouble([elevatorSim.getCurrentDraw()]),
        ),
      );

      elevatorSim.update(0.02);
      timestamp += 0.02;
    }

    expect(elevatorSim.getPosition()).toBeCloseTo(0.912);
  });
});
