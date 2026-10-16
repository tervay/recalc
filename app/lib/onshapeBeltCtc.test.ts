import { describe, expect, it } from 'vitest';

import Measurement from '~/lib/models/Measurement';
import { formatBeltCtc, parseBeltCtc } from '~/lib/onshapeBeltCtc';

describe('parseBeltCtc', () => {
  it('parses belt teeth from a 5mm expression', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24, 16)')?.beltTeeth).toBe(70);
  });

  it('parses pulley 1 teeth from a 5mm expression', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24, 16)')?.p1Teeth).toBe(24);
  });

  it('parses pulley 2 teeth from a 5mm expression', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24, 16)')?.p2Teeth).toBe(16);
  });

  it('parses a 5mm expression as 5mm pitch', () => {
    expect(
      parseBeltCtc('#BeltCTC_5mm(70, 24, 16)')?.pitch.eq(
        new Measurement(5, 'mm'),
      ),
    ).toBe(true);
  });

  it('parses a 5mm expression with a tooth increment of 5', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24, 16)')?.toothIncrement).toBe(5);
  });

  it('parses a 3mm expression as 3mm pitch', () => {
    expect(
      parseBeltCtc('#BeltCTC_3mm(100, 20, 30)')?.pitch.eq(
        new Measurement(3, 'mm'),
      ),
    ).toBe(true);
  });

  it('parses a 3mm expression with a tooth increment of 5', () => {
    expect(parseBeltCtc('#BeltCTC_3mm(100, 20, 30)')?.toothIncrement).toBe(5);
  });

  it('parses an RT25 expression as 0.25in pitch', () => {
    expect(
      parseBeltCtc('#BeltCTC_RT25(80, 18, 36)')?.pitch.eq(
        new Measurement(0.25, 'in'),
      ),
    ).toBe(true);
  });

  it('parses an RT25 expression with a tooth increment of 8', () => {
    expect(parseBeltCtc('#BeltCTC_RT25(80, 18, 36)')?.toothIncrement).toBe(8);
  });

  it('defaults extra center to zero without a suffix', () => {
    expect(
      parseBeltCtc('#BeltCTC_5mm(70, 24, 16)')?.extraCenter.eq(
        new Measurement(0, 'mm'),
      ),
    ).toBe(true);
  });

  it('parses an expression without spaces', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(80,18,36)')?.p2Teeth).toBe(36);
  });

  it('parses an expression with surrounding and inner whitespace', () => {
    expect(parseBeltCtc('  #BeltCTC_5mm ( 80 ,18 , 36 )  ')?.beltTeeth).toBe(
      80,
    );
  });

  it('parses an expression without the leading hash', () => {
    expect(parseBeltCtc('BeltCTC_5mm(80, 18, 36)')?.p1Teeth).toBe(18);
  });

  it('parses the function name case-insensitively', () => {
    expect(parseBeltCtc('#beltctc_rt25(80, 18, 36)')?.toothIncrement).toBe(8);
  });

  it('parses a positive extra center suffix', () => {
    expect(
      parseBeltCtc('#BeltCTC_5mm(70, 24, 16) + 0.5 mm')?.extraCenter.eq(
        new Measurement(0.5, 'mm'),
      ),
    ).toBe(true);
  });

  it('parses a negative extra center suffix in inches', () => {
    expect(
      parseBeltCtc('#BeltCTC_5mm(70, 24, 16) - 0.1 in')?.extraCenter.eq(
        new Measurement(-0.1, 'in'),
      ),
    ).toBe(true);
  });

  it('parses an extra center suffix without spaces', () => {
    expect(
      parseBeltCtc('#BeltCTC_5mm(70,24,16)+.25in')?.extraCenter.eq(
        new Measurement(0.25, 'in'),
      ),
    ).toBe(true);
  });

  it('rejects an unsupported pitch', () => {
    expect(parseBeltCtc('#BeltCTC_2mm(70, 24, 16)')).toBeNull();
  });

  it('rejects too few arguments', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24)')).toBeNull();
  });

  it('rejects too many arguments', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24, 16, 2)')).toBeNull();
  });

  it('rejects zero teeth', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 0, 16)')).toBeNull();
  });

  it('rejects negative teeth', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, -24, 16)')).toBeNull();
  });

  it('rejects fractional teeth', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70.5, 24, 16)')).toBeNull();
  });

  it('rejects a non-length extra center unit', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24, 16) + 2 kg')).toBeNull();
  });

  it('rejects an unknown extra center unit', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24, 16) + 2 bogus')).toBeNull();
  });

  it('rejects an extra center without a unit', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24, 16) + 2')).toBeNull();
  });

  it('rejects trailing text', () => {
    expect(parseBeltCtc('#BeltCTC_5mm(70, 24, 16) foo')).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(parseBeltCtc('')).toBeNull();
  });
});

describe('formatBeltCtc', () => {
  const base = {
    beltTeeth: 70,
    p1Teeth: 24,
    p2Teeth: 16,
    extraCenter: new Measurement(0, 'mm'),
  };

  it('formats a 5mm belt', () => {
    expect(formatBeltCtc({ ...base, pitch: new Measurement(5, 'mm') })).toBe(
      '#BeltCTC_5mm(70, 24, 16)',
    );
  });

  it('formats a 3mm belt', () => {
    expect(formatBeltCtc({ ...base, pitch: new Measurement(3, 'mm') })).toBe(
      '#BeltCTC_3mm(70, 24, 16)',
    );
  });

  it('formats an RT25 belt', () => {
    expect(formatBeltCtc({ ...base, pitch: new Measurement(0.25, 'in') })).toBe(
      '#BeltCTC_RT25(70, 24, 16)',
    );
  });

  it('formats an RT25 belt given pitch in millimeters', () => {
    expect(formatBeltCtc({ ...base, pitch: new Measurement(6.35, 'mm') })).toBe(
      '#BeltCTC_RT25(70, 24, 16)',
    );
  });

  it('appends a positive extra center', () => {
    expect(
      formatBeltCtc({
        ...base,
        pitch: new Measurement(5, 'mm'),
        extraCenter: new Measurement(0.5, 'mm'),
      }),
    ).toBe('#BeltCTC_5mm(70, 24, 16) + 0.5 mm');
  });

  it('appends a negative extra center', () => {
    expect(
      formatBeltCtc({
        ...base,
        pitch: new Measurement(5, 'mm'),
        extraCenter: new Measurement(-0.1, 'in'),
      }),
    ).toBe('#BeltCTC_5mm(70, 24, 16) - 0.1 in');
  });

  it('returns null for an unsupported pitch', () => {
    expect(
      formatBeltCtc({ ...base, pitch: new Measurement(2, 'mm') }),
    ).toBeNull();
  });

  it('returns null for zero belt teeth', () => {
    expect(
      formatBeltCtc({
        ...base,
        pitch: new Measurement(5, 'mm'),
        beltTeeth: 0,
      }),
    ).toBeNull();
  });

  it('returns null for fractional pulley teeth', () => {
    expect(
      formatBeltCtc({
        ...base,
        pitch: new Measurement(5, 'mm'),
        p1Teeth: 24.5,
      }),
    ).toBeNull();
  });

  it('round-trips through parseBeltCtc', () => {
    const expression = '#BeltCTC_RT25(80, 18, 36) - 0.02 in';
    const parsed = parseBeltCtc(expression);
    expect(parsed && formatBeltCtc(parsed)).toBe(expression);
  });
});
