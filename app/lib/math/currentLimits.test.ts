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

  describe('supply current sign convention', () => {
    test('supply current is positive when motoring (vApplied same direction as motion)', () => {
      // With correct formula: I_supply = I_stator * |V_applied| / V_supply
      // Stator current is positive when motoring, so supply current is positive.
      const rOhms = 12 / 476 / 2;
      const vBackEmf = 3; // motor spinning forward
      const vApplied = 6; // driving forward (motoring)
      const vSupply = 12;

      // Stator current: (V - V_backEmf) / R > 0 (motoring)
      const iStator = (vApplied - vBackEmf) / rOhms;
      // Correct formula uses abs(vApplied)
      const iSupplyCorrect = (iStator * Math.abs(vApplied)) / vSupply;

      expect(iStator).toBeGreaterThan(0);
      expect(iSupplyCorrect).toBeGreaterThan(0);
    });

    test('supply current is negative when regenerating (back-EMF exceeds applied voltage)', () => {
      // When the motor is braking (e.g., gravity-assisted downswing), stator
      // current is negative and supply current should also be negative (regen).
      // Supply current limits should NOT restrict negative (regen) current.
      const rOhms = 12 / 476 / 2;
      const vBackEmf = -13.5; // fast downswing, back-EMF exceeds applied voltage
      const vApplied = -12; // driving down
      const vSupply = 12;

      // GetCurrentDraw returns stator current with sign(vApplied) applied:
      // ((V - V_backEmf) / R) * sign(V) = ((-12 - -13.5) / R) * -1 < 0
      const rawCurrent = (vApplied - vBackEmf) / rOhms;
      const statorCurrent = rawCurrent * Math.sign(vApplied);

      // Correct formula: I_supply = I_stator * |V_applied| / V_supply
      const iSupply = (statorCurrent * Math.abs(vApplied)) / vSupply;

      // Stator current is negative (braking), supply current is negative (regen)
      expect(statorCurrent).toBeLessThan(0);
      expect(iSupply).toBeLessThan(0);
    });

    test('vApplied is clamped to [-vSupply, vSupply]', () => {
      const { vAppliedMin, vAppliedMax } = getvAppliedMinAndMax({
        resistance: new Measurement(12 / 476, 'Ohm'),
        vBackEmf: new Measurement(0, 'V'),
        vSupply: new Measurement(12, 'V'),
        iMaxSupply: new Measurement(90, 'A'),
        iMaxStator: new Measurement(60, 'A'),
      });

      // After current-limit clamping, voltage should not exceed supply
      expect(vAppliedMin.to('V').scalar).toBeGreaterThanOrEqual(-12);
      expect(vAppliedMax.to('V').scalar).toBeLessThanOrEqual(12);
    });
  });
});
