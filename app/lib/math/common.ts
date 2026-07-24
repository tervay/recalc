import Measurement from '~/lib/models/Measurement';

export function supplyLimitToStatorLimit({
  supplyLimit,
  supplyVoltage,
  statorVoltage,
}: {
  supplyLimit: Measurement;
  supplyVoltage: Measurement;
  statorVoltage: Measurement;
}): Measurement {
  if (statorVoltage.scalar === 0) {
    return new Measurement(0, 'A');
  }

  return supplyLimit.mul(supplyVoltage).div(statorVoltage);
}
