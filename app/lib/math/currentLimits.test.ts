import { describe, expect, test } from 'vitest';

import { getvAppliedMinAndMax } from '~/lib/math/currentLimits';
import Measurement from '~/lib/models/Measurement';

describe('currentLimits', () => {
  describe('getVAppliedMin', () => {
    const testCases: {
      resistance: Measurement;
      vBackEmf: Measurement;
      vSupply: Measurement;
      iMaxSupply: Measurement;
      iMaxStator: Measurement;
      expected: {
        vAppliedMin: Measurement;
        vAppliedMax: Measurement;
      };
    }[] = [
      {
        resistance: new Measurement(12 / 476, 'Ohm'),
        vBackEmf: new Measurement(0, 'V'),
        vSupply: new Measurement(12, 'V'),
        iMaxSupply: new Measurement(90, 'A'),
        iMaxStator: new Measurement(60, 'A'),
        expected: {
          vAppliedMin: new Measurement(-1.51261, 'V'),
          vAppliedMax: new Measurement(1.51261, 'V'),
        },
      },
    ];

    testCases.forEach((testCase) => {
      test(`should return the correct vApplied min and max for ${testCase.resistance.to('Ohm').scalar} ${testCase.vBackEmf.to('V').scalar} ${testCase.vSupply.to('V').scalar} ${testCase.iMaxSupply.to('A').scalar} ${testCase.iMaxStator.to('A').scalar}`, () => {
        const { vAppliedMin, vAppliedMax } = getvAppliedMinAndMax({
          resistance: testCase.resistance,
          vBackEmf: testCase.vBackEmf,
          vSupply: testCase.vSupply,
          iMaxSupply: testCase.iMaxSupply,
          iMaxStator: testCase.iMaxStator,
        });

        expect(vAppliedMin.to('V').scalar).toBeCloseTo(
          testCase.expected.vAppliedMin.to('V').scalar,
        );

        expect(vAppliedMax.to('V').scalar).toBeCloseTo(
          testCase.expected.vAppliedMax.to('V').scalar,
        );
      });
    });
  });
});
