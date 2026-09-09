import Measurement from '~/lib/models/Measurement';
import type Ratio from '~/lib/models/Ratio';

export const VELOCITY_UNITS = [
  'in/s',
  'ft/s',
  'mph',
  'm/s',
  'kph',
  'rotation/s',
  'rpm',
];

export const ACCELERATION_UNITS = ['in/s2', 'ft/s2', 'm/s2', 'rotation/s2'];

export const KV_UNITS = ['V*s/m', 'V*s/ft', 'V*s/in', 'V*s/rotation'];

export const KA_UNITS = ['V*s^2/m', 'V*s^2/ft', 'V*s^2/in', 'V*s^2/rotation'];

export const KP_UNITS = ['V/m', 'V/ft', 'V/in', 'V/rotation'];

export function metersPerMotorRotation(
  spoolDiameter: Measurement,
  ratio: Ratio,
): Measurement | null {
  const diameterMeters = spoolDiameter.to('m').scalar;
  const gearing = ratio.asNumber();

  if (
    !Number.isFinite(diameterMeters) ||
    !Number.isFinite(gearing) ||
    diameterMeters === 0 ||
    gearing === 0
  ) {
    return null;
  }

  return new Measurement((Math.PI * diameterMeters) / gearing, 'm/rotation');
}

export function convertAcrossDomains(
  value: Measurement,
  unit: string,
  factor: Measurement,
): Measurement {
  if (value.isCompatible(unit)) {
    return value.to(unit);
  }

  const multiplied = value.mul(factor);
  if (multiplied.isCompatible(unit)) {
    return multiplied.to(unit);
  }

  return value.div(factor).to(unit);
}

export function toLinear(
  value: Measurement,
  unit: string,
  factor: Measurement | null,
): Measurement {
  if (value.isCompatible(unit)) {
    return value.to(unit);
  }

  if (factor === null) {
    return new Measurement(0, unit);
  }

  return convertAcrossDomains(value, unit, factor);
}
