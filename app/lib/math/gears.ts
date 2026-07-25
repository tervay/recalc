import Measurement from '~/lib/models/Measurement';

export function calculateSpacing(
  gear1Teeth: number,
  gear2Teeth: number,
  gearDP: number,
) {
  if (gear1Teeth === 0 || gear2Teeth === 0 || gearDP === 0) {
    return new Measurement(0, 'in');
  }

  return new Measurement(
    gear1Teeth / gearDP / 2 + gear2Teeth / gearDP / 2,
    'in',
  );
}
