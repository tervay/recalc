import Measurement from '~/lib/models/Measurement';
import { SimplePulley } from '~/lib/models/Pulley';
import { SimpleSprocket } from '~/lib/models/Sprocket';
import { type BeltProfile, zBeltProfileSchema } from '~/lib/types/pulleys';
import type { ChainType } from '~/lib/types/sprockets';

const BELT_PROFILE_PITCH: Record<BeltProfile, Measurement> = {
  GT2: new Measurement(3, 'mm'),
  HTD: new Measurement(5, 'mm'),
  RT25: new Measurement(0.25, 'in'),
};

export function spoolPitchDiameter(
  type: BeltProfile | ChainType,
  teeth: number,
): Measurement {
  const belt = zBeltProfileSchema.safeParse(type);
  return belt.success
    ? new SimplePulley(teeth, BELT_PROFILE_PITCH[belt.data]).pitchDiameter
    : new SimpleSprocket(teeth, type).pitchDiameter;
}
