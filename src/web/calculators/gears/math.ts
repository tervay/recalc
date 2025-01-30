import Measurement from "common/models/Measurement";

export function calculateSpacing(
  gear1Teeth: number,
  gear2Teeth: number,
  gearDP: number,
): Measurement {
  return new Measurement(
    gear1Teeth / gearDP / 2 + gear2Teeth / gearDP / 2,
    "in",
  );
}
