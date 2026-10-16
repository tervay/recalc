import Measurement from '~/lib/models/Measurement';

const BELT_CTC_PROFILES = [
  { name: '3mm', pitch: new Measurement(3, 'mm'), toothIncrement: 5 },
  { name: '5mm', pitch: new Measurement(5, 'mm'), toothIncrement: 5 },
  { name: 'RT25', pitch: new Measurement(0.25, 'in'), toothIncrement: 8 },
];

const BELT_CTC_PATTERN =
  /^#?BeltCTC_(3mm|5mm|RT25)\s*\(([^,()]*),([^,()]*),([^,()]*)\)\s*(?:([+-])\s*(\d*\.?\d+)\s*([a-z]+))?$/i;

export type BeltCtc = {
  pitch: Measurement;
  beltTeeth: number;
  p1Teeth: number;
  p2Teeth: number;
  extraCenter: Measurement;
};

export type ParsedBeltCtc = BeltCtc & { toothIncrement: number };

function isValidTeeth(teeth: number): boolean {
  return Number.isInteger(teeth) && teeth > 0;
}

function parseTeeth(text: string): number | null {
  const teeth = Number(text);
  return isValidTeeth(teeth) ? teeth : null;
}

function parseLength(magnitude: number, unit: string): Measurement | null {
  try {
    const length = new Measurement(magnitude, unit);
    return length.isCompatible('mm') ? length : null;
  } catch {
    return null;
  }
}

export function parseBeltCtc(text: string): ParsedBeltCtc | null {
  const match = BELT_CTC_PATTERN.exec(text.trim());
  if (match === null) return null;

  const [, name, belt, p1, p2, sign, magnitude, unit] = match;
  const profile = BELT_CTC_PROFILES.find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  );
  const beltTeeth = parseTeeth(belt);
  const p1Teeth = parseTeeth(p1);
  const p2Teeth = parseTeeth(p2);
  const extraCenter =
    unit === undefined
      ? new Measurement(0, 'mm')
      : parseLength(Number(sign + magnitude), unit);

  if (
    profile === undefined ||
    beltTeeth === null ||
    p1Teeth === null ||
    p2Teeth === null ||
    extraCenter === null
  )
    return null;

  return {
    pitch: profile.pitch,
    toothIncrement: profile.toothIncrement,
    beltTeeth,
    p1Teeth,
    p2Teeth,
    extraCenter,
  };
}

export function formatBeltCtc({
  pitch,
  beltTeeth,
  p1Teeth,
  p2Teeth,
  extraCenter,
}: BeltCtc): string | null {
  const profile = BELT_CTC_PROFILES.find((p) => p.pitch.eq(pitch));
  if (
    profile === undefined ||
    ![beltTeeth, p1Teeth, p2Teeth].every(isValidTeeth)
  )
    return null;

  const call = `#BeltCTC_${profile.name}(${beltTeeth}, ${p1Teeth}, ${p2Teeth})`;
  if (extraCenter.scalar === 0) return call;

  const sign = extraCenter.scalar < 0 ? '-' : '+';
  return `${call} ${sign} ${Math.abs(extraCenter.scalar)} ${extraCenter.units()}`;
}
