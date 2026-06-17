import { describe, expect, it } from 'vitest';

import { buildCopyLinkData } from '~/components/recalc/calcHeading';

describe('buildCopyLinkData', () => {
  it('includes the motor identifier when a valid motor query param is present', () => {
    const motorParam = JSON.stringify({
      name: 'Kraken X60 (FOC)',
      quantity: 1,
    });
    const search = `?motor=${encodeURIComponent(motorParam)}`;

    expect(buildCopyLinkData('Arm Calculator', search)).toEqual({
      calculator: 'Arm Calculator',
      motor: 'Kraken X60 (FOC)',
    });
  });

  it('omits the motor field when no motor query param is present', () => {
    const data = buildCopyLinkData('Gears Calculator', '');

    expect(data).toEqual({ calculator: 'Gears Calculator' });
    expect(data).not.toHaveProperty('motor');
  });

  it('omits the motor field when the motor query param is invalid', () => {
    const data = buildCopyLinkData('Arm Calculator', '?motor=not-json');

    expect(data).toEqual({ calculator: 'Arm Calculator' });
    expect(data).not.toHaveProperty('motor');
  });
});
