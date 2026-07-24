import type Measurement from '~/lib/models/Measurement';

export function calculateLoadedBatteryVoltage(
  supplyVoltage: Measurement,
  batteryResistance: Measurement,
  currents: Measurement[],
): Measurement {
  let retval = supplyVoltage;

  for (const current of currents) {
    retval = retval.sub(current.mul(batteryResistance));
  }

  return retval;
}
