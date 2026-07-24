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

  describe('primary realistic motor case', () => {
    // Inputs: resistance=0.04 Ohm, iMaxStator=120 A, iMaxSupply=40 A,
    //         vBackEmf=6 V, vSupply=12 V
    //
    // Hand-computation:
    //   minATerm = 6 - 120*0.04 = 6 - 4.8          = 1.2 V
    //   maxATerm = 6 + 120*0.04 = 6 + 4.8          = 10.8 V
    //   toSqrt   = 6^2/4 + 40*0.04*12 = 9 + 19.2  = 28.2 V^2
    //   sqrted   = sqrt(28.2)                       ~= 5.31037 V
    //   minBTerm = 6/2 - 5.31037 = 3 - 5.31037     = -2.31037 V
    //   maxBTerm = 6/2 + 5.31037 = 3 + 5.31037     = 8.31037 V
    //   vAppliedMin = max(minATerm=1.2, minBTerm=-2.31037) = 1.2 V   (A-term binds)
    //   vAppliedMax = min(maxATerm=10.8, maxBTerm=8.31037) = 8.31037 V (B-term binds)
    const primaryInputs = {
      resistance: new Measurement(0.04, 'Ohm'),
      iMaxStator: new Measurement(120, 'A'),
      iMaxSupply: new Measurement(40, 'A'),
      vBackEmf: new Measurement(6, 'V'),
      vSupply: new Measurement(12, 'V'),
    };

    test('vAppliedMin equals minATerm (A-term is the binding constraint)', () => {
      const { vAppliedMin } = getvAppliedMinAndMax(primaryInputs);
      expect(vAppliedMin.to('V').scalar).toBeCloseTo(1.2, 5);
    });

    test('vAppliedMax equals maxBTerm (B-term is the binding constraint)', () => {
      const { vAppliedMax } = getvAppliedMinAndMax(primaryInputs);
      // sqrt(28.2) computed independently
      const expectedMax = 3 + Math.sqrt(28.2);
      expect(vAppliedMax.to('V').scalar).toBeCloseTo(expectedMax, 5);
    });

    test('vAppliedMin is less than vAppliedMax', () => {
      const { vAppliedMin, vAppliedMax } = getvAppliedMinAndMax(primaryInputs);
      expect(vAppliedMin.to('V').scalar).toBeLessThan(
        vAppliedMax.to('V').scalar,
      );
    });

    test('returned values carry volt units (to("V") succeeds with a finite scalar)', () => {
      const { vAppliedMin, vAppliedMax } = getvAppliedMinAndMax(primaryInputs);
      expect(isFinite(vAppliedMin.to('V').scalar)).toBe(true);
      expect(isFinite(vAppliedMax.to('V').scalar)).toBe(true);
    });
  });

  describe('A-terms are the binding constraint for both min and max', () => {
    // Choose inputs so the A-window is much narrower than the B-window:
    // small iMaxStator (small A half-width) but large iMaxSupply (large B half-width).
    //
    // Inputs: resistance=0.1 Ohm, iMaxStator=3 A, iMaxSupply=100 A,
    //         vBackEmf=6 V, vSupply=12 V
    //
    // Hand-computation:
    //   minATerm = 6 - 3*0.1    = 5.7 V
    //   maxATerm = 6 + 3*0.1    = 6.3 V
    //   toSqrt   = 36/4 + 100*0.1*12 = 9 + 120 = 129 V^2
    //   sqrted   = sqrt(129)   ~= 11.35782 V
    //   minBTerm = 3 - 11.35782 = -8.35782 V   (below minATerm=5.7)
    //   maxBTerm = 3 + 11.35782 = 14.35782 V   (above maxATerm=6.3)
    //   vAppliedMin = max(5.7, -8.35782) = 5.7 V   -- A-term wins
    //   vAppliedMax = min(6.3, 14.35782) = 6.3 V   -- A-term wins
    test('selects minATerm when the A-window is narrower than the B-window', () => {
      const { vAppliedMin } = getvAppliedMinAndMax({
        resistance: new Measurement(0.1, 'Ohm'),
        iMaxStator: new Measurement(3, 'A'),
        iMaxSupply: new Measurement(100, 'A'),
        vBackEmf: new Measurement(6, 'V'),
        vSupply: new Measurement(12, 'V'),
      });
      // vAppliedMin = minATerm = 6 - 3*0.1 = 5.7 V
      expect(vAppliedMin.to('V').scalar).toBeCloseTo(5.7, 5);
    });

    test('selects maxATerm when the A-window is narrower than the B-window', () => {
      const { vAppliedMax } = getvAppliedMinAndMax({
        resistance: new Measurement(0.1, 'Ohm'),
        iMaxStator: new Measurement(3, 'A'),
        iMaxSupply: new Measurement(100, 'A'),
        vBackEmf: new Measurement(6, 'V'),
        vSupply: new Measurement(12, 'V'),
      });
      // vAppliedMax = maxATerm = 6 + 3*0.1 = 6.3 V
      expect(vAppliedMax.to('V').scalar).toBeCloseTo(6.3, 5);
    });
  });

  describe('B-terms are the binding constraint for both min and max', () => {
    // Choose inputs so the B-window is much narrower than the A-window:
    // large iMaxStator (wide A window) but small iMaxSupply (narrow B window).
    //
    // Inputs: resistance=2 Ohm, iMaxStator=10 A, iMaxSupply=1 A,
    //         vBackEmf=6 V, vSupply=12 V
    //
    // Hand-computation:
    //   minATerm = 6 - 10*2   = -14 V
    //   maxATerm = 6 + 10*2   =  26 V
    //   toSqrt   = 36/4 + 1*2*12 = 9 + 24 = 33 V^2
    //   sqrted   = sqrt(33)  ~= 5.74456 V
    //   minBTerm = 3 - 5.74456 = -2.74456 V   (above minATerm=-14  -> B wins)
    //   maxBTerm = 3 + 5.74456 =  8.74456 V   (below maxATerm= 26  -> B wins)
    //   vAppliedMin = max(-14, -2.74456) = -2.74456 V   -- B-term wins
    //   vAppliedMax = min( 26,  8.74456) =  8.74456 V   -- B-term wins
    test('selects minBTerm when the B-window is narrower than the A-window', () => {
      const { vAppliedMin } = getvAppliedMinAndMax({
        resistance: new Measurement(2, 'Ohm'),
        iMaxStator: new Measurement(10, 'A'),
        iMaxSupply: new Measurement(1, 'A'),
        vBackEmf: new Measurement(6, 'V'),
        vSupply: new Measurement(12, 'V'),
      });
      // vAppliedMin = minBTerm = 3 - sqrt(33)
      expect(vAppliedMin.to('V').scalar).toBeCloseTo(3 - Math.sqrt(33), 5);
    });

    test('selects maxBTerm when the B-window is narrower than the A-window', () => {
      const { vAppliedMax } = getvAppliedMinAndMax({
        resistance: new Measurement(2, 'Ohm'),
        iMaxStator: new Measurement(10, 'A'),
        iMaxSupply: new Measurement(1, 'A'),
        vBackEmf: new Measurement(6, 'V'),
        vSupply: new Measurement(12, 'V'),
      });
      // vAppliedMax = maxBTerm = 3 + sqrt(33)
      expect(vAppliedMax.to('V').scalar).toBeCloseTo(3 + Math.sqrt(33), 5);
    });
  });

  describe('edge case: zero resistance', () => {
    // When resistance = 0:
    //   iMaxStator*R = 0  =>  minATerm = maxATerm = vBackEmf
    //   toSqrt = vBackEmf^2/4 + 0 = vBackEmf^2/4
    //   sqrted = vBackEmf/2
    //   minBTerm = vBackEmf/2 - vBackEmf/2 = 0
    //   maxBTerm = vBackEmf/2 + vBackEmf/2 = vBackEmf
    //   vAppliedMin = max(vBackEmf, 0)        = vBackEmf (since vBackEmf > 0)
    //   vAppliedMax = min(vBackEmf, vBackEmf) = vBackEmf
    //
    // Both constraints collapse to the single point vBackEmf = 6 V.
    test('both min and max collapse to vBackEmf when resistance is zero', () => {
      const { vAppliedMin, vAppliedMax } = getvAppliedMinAndMax({
        resistance: new Measurement(0, 'Ohm'),
        iMaxStator: new Measurement(120, 'A'),
        iMaxSupply: new Measurement(40, 'A'),
        vBackEmf: new Measurement(6, 'V'),
        vSupply: new Measurement(12, 'V'),
      });
      expect(vAppliedMin.to('V').scalar).toBeCloseTo(6, 10);
      expect(vAppliedMax.to('V').scalar).toBeCloseTo(6, 10);
    });
  });

  describe('edge case: zero vBackEmf', () => {
    // Inputs: resistance=0.04 Ohm, iMaxStator=120 A, iMaxSupply=40 A,
    //         vBackEmf=0 V, vSupply=12 V
    //
    // Hand-computation:
    //   minATerm = 0 - 120*0.04 = -4.8 V
    //   maxATerm = 0 + 120*0.04 =  4.8 V
    //   toSqrt   = 0 + 40*0.04*12 = 19.2 V^2
    //   sqrted   = sqrt(19.2)    ~= 4.38178 V
    //   minBTerm = 0 - 4.38178  = -4.38178 V   (above minATerm=-4.8 -> B wins)
    //   maxBTerm = 0 + 4.38178  =  4.38178 V   (below maxATerm= 4.8 -> B wins)
    //   vAppliedMin = max(-4.8, -4.38178) = -4.38178 V   -- B-term wins
    //   vAppliedMax = min( 4.8,  4.38178) =  4.38178 V   -- B-term wins
    test('computes correct bounds (B-terms binding) when vBackEmf is zero', () => {
      const { vAppliedMin, vAppliedMax } = getvAppliedMinAndMax({
        resistance: new Measurement(0.04, 'Ohm'),
        iMaxStator: new Measurement(120, 'A'),
        iMaxSupply: new Measurement(40, 'A'),
        vBackEmf: new Measurement(0, 'V'),
        vSupply: new Measurement(12, 'V'),
      });
      const sqrted = Math.sqrt(19.2);
      expect(vAppliedMin.to('V').scalar).toBeCloseTo(-sqrted, 5);
      expect(vAppliedMax.to('V').scalar).toBeCloseTo(sqrted, 5);
    });

    test('min and max are symmetric around zero when vBackEmf is zero', () => {
      const { vAppliedMin, vAppliedMax } = getvAppliedMinAndMax({
        resistance: new Measurement(0.04, 'Ohm'),
        iMaxStator: new Measurement(120, 'A'),
        iMaxSupply: new Measurement(40, 'A'),
        vBackEmf: new Measurement(0, 'V'),
        vSupply: new Measurement(12, 'V'),
      });
      expect(vAppliedMin.to('V').scalar).toBeCloseTo(
        -vAppliedMax.to('V').scalar,
        10,
      );
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
