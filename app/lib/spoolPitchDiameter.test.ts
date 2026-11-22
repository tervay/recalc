import { describe, expect, it } from 'vitest';

import { spoolPitchDiameter } from '~/lib/spoolPitchDiameter';

describe('spoolPitchDiameter', () => {
  it('uses a 3mm pitch for GT2', () => {
    expect(spoolPitchDiameter('GT2', 30).to('mm').scalar).toBeCloseTo(
      90 / Math.PI,
      10,
    );
  });

  it('uses a 5mm pitch for HTD', () => {
    expect(spoolPitchDiameter('HTD', 22).to('mm').scalar).toBeCloseTo(
      110 / Math.PI,
      10,
    );
  });

  it('uses a 0.25in pitch for RT25', () => {
    expect(spoolPitchDiameter('RT25', 24).to('in').scalar).toBeCloseTo(
      6 / Math.PI,
      10,
    );
  });

  it('uses a 0.25in pitch for #25 chain', () => {
    expect(spoolPitchDiameter('#25', 16).to('in').scalar).toBeCloseTo(
      4 / Math.PI,
      10,
    );
  });

  it('uses a 0.375in pitch for #35 chain', () => {
    expect(spoolPitchDiameter('#35', 18).to('in').scalar).toBeCloseTo(
      6.75 / Math.PI,
      10,
    );
  });

  it('returns zero diameter for zero teeth', () => {
    expect(spoolPitchDiameter('HTD', 0).scalar).toBe(0);
  });
});
