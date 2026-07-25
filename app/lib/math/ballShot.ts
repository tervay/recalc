import Measurement from '~/lib/models/Measurement';

export type ShooterMode = 'single-hooded' | 'dual-shooter' | 'compound';

export interface ShotResult {
  exitVelocity: Measurement;
  exitSpinRate: Measurement;
  postShotOmega: Measurement;
  ballKineticEnergy: Measurement;
  flywheelEnergyLost: Measurement;
}

function zeroResult(): ShotResult {
  return {
    exitVelocity: new Measurement(0, 'm/s'),
    exitSpinRate: new Measurement(0, 'rpm'),
    postShotOmega: new Measurement(0, 'rad/s'),
    ballKineticEnergy: new Measurement(0, 'J'),
    flywheelEnergyLost: new Measurement(0, 'J'),
  };
}

function toResult(
  omegaWf: number,
  vBf: number,
  omegaBf: number,
  iW: number,
  omegaWi: number,
  mB: number,
  iB: number,
): ShotResult {
  const ballKEJ = 0.5 * mB * vBf * vBf + 0.5 * iB * omegaBf * omegaBf;
  const energyLostJ = 0.5 * iW * (omegaWi * omegaWi - omegaWf * omegaWf);
  const spinRpm = (omegaBf * 60) / (2 * Math.PI);

  return {
    exitVelocity: new Measurement(vBf, 'm/s'),
    exitSpinRate: new Measurement(spinRpm, 'rpm'),
    postShotOmega: new Measurement(omegaWf, 'rad/s'),
    ballKineticEnergy: new Measurement(ballKEJ, 'J'),
    flywheelEnergyLost: new Measurement(energyLostJ, 'J'),
  };
}

interface RawShotState {
  omegaWf: number;
  vBf: number;
  omegaBf: number;
}

// Team 449 Appendix A: single shooter wheel + hood
// Full form includes V_bi and ω_bi; setting both to 0 reproduces the prior behavior.
function rawSingleHooded(
  omegaWi: number,
  rW: number,
  iW: number,
  mB: number,
  rB: number,
  iB: number,
  vBi: number,
  omegaBi: number,
): RawShotState | null {
  if (iW === 0 || rW === 0 || omegaWi === 0) return null;

  const D = 4 * iW * rB * rB + iB * rW * rW + mB * rW * rW * rB * rB;
  if (D === 0) return null;

  const omegaWf =
    (4 * iW * rB * rB * omegaWi +
      2 * iB * rW * rB * omegaBi +
      2 * mB * rW * rB * rB * vBi) /
    D;
  const vBf = (rW / 2) * omegaWf;
  const omegaBf = rB !== 0 ? vBf / rB : 0;

  return { omegaWf, vBf, omegaBf };
}

// Team 449 main body: dual shooter wheel (Wheel 1 + Wheel 2 at ratio G)
// Full form includes V_bi and ω_bi; setting both to 0 reproduces the prior behavior.
function rawDualShooter(
  omegaW1i: number,
  rW1: number,
  iW: number,
  mB: number,
  rB: number,
  iB: number,
  rW2: number,
  G: number,
  vBi: number,
  omegaBi: number,
): RawShotState | null {
  if (iW === 0 || rW1 === 0 || omegaW1i === 0) return null;

  const A = rW1 + G * rW2;
  const B = rW1 - G * rW2;
  const ibTerm = rB !== 0 ? (B * B * iB) / (rB * rB) : 0;
  const D = 4 * iW + ibTerm + A * A * mB;

  if (D === 0) return null;

  const iBOverRb = rB !== 0 ? iB / rB : 0;
  const omegaW1f =
    (4 * iW * omegaW1i + 2 * B * iBOverRb * omegaBi + 2 * A * mB * vBi) / D;
  const vBf = (A / 2) * omegaW1f;
  const omegaBf = rB !== 0 ? (B / (2 * rB)) * omegaW1f : 0;

  return { omegaWf: omegaW1f, vBf, omegaBf };
}

// Team 449 §2.3: compound — single-hooded section feeds dual-shooter section.
// Stage 1 output becomes Stage 2 initial conditions; I_w is shared across both stages.
// flywheelEnergyLost is measured against the original ω_w1i, not the intermediate.
function compound(
  omegaW1i: number,
  rW1: number,
  iW: number,
  mB: number,
  rB: number,
  iB: number,
  rW2: number,
  G: number,
  vBi: number,
  omegaBi: number,
): ShotResult {
  const intermediate = rawSingleHooded(
    omegaW1i,
    rW1,
    iW,
    mB,
    rB,
    iB,
    vBi,
    omegaBi,
  );
  if (intermediate === null) return zeroResult();

  const final = rawDualShooter(
    intermediate.omegaWf,
    rW1,
    iW,
    mB,
    rB,
    iB,
    rW2,
    G,
    intermediate.vBf,
    intermediate.omegaBf,
  );
  if (final === null) return zeroResult();

  return toResult(
    final.omegaWf,
    final.vBf,
    final.omegaBf,
    iW,
    omegaW1i,
    mB,
    iB,
  );
}

function singleHooded(
  omegaWi: number,
  rW: number,
  iW: number,
  mB: number,
  rB: number,
  iB: number,
  vBi: number,
  omegaBi: number,
): ShotResult {
  const raw = rawSingleHooded(omegaWi, rW, iW, mB, rB, iB, vBi, omegaBi);
  if (raw === null) return zeroResult();
  return toResult(raw.omegaWf, raw.vBf, raw.omegaBf, iW, omegaWi, mB, iB);
}

function dualShooter(
  omegaW1i: number,
  rW1: number,
  iW: number,
  mB: number,
  rB: number,
  iB: number,
  rW2: number,
  G: number,
  vBi: number,
  omegaBi: number,
): ShotResult {
  const raw = rawDualShooter(
    omegaW1i,
    rW1,
    iW,
    mB,
    rB,
    iB,
    rW2,
    G,
    vBi,
    omegaBi,
  );
  if (raw === null) return zeroResult();
  return toResult(raw.omegaWf, raw.vBf, raw.omegaBf, iW, omegaW1i, mB, iB);
}

export function computeShotResult(args: {
  mode: ShooterMode;
  flywheelOmega: Measurement;
  shooterRadius: Measurement;
  combinedMOI: Measurement;
  ballMass: Measurement;
  ballRadius: Measurement;
  ballMOI: Measurement;
  ballInitialVelocity?: Measurement;
  ballInitialSpin?: Measurement;
  secondaryRadius?: Measurement;
  secondaryToShooterRatio?: number;
}): ShotResult {
  const omegaWi = args.flywheelOmega.to('rad/s').scalar;
  const rW = args.shooterRadius.to('m').scalar;
  const iW = args.combinedMOI.to('kg*m^2').scalar;
  const mB = args.ballMass.to('kg').scalar;
  const rB = args.ballRadius.to('m').scalar;
  const iB = args.ballMOI.to('kg*m^2').scalar;
  const vBi = args.ballInitialVelocity?.to('m/s').scalar ?? 0;
  const omegaBi = args.ballInitialSpin?.to('rad/s').scalar ?? 0;

  if (args.mode === 'dual-shooter') {
    if (args.secondaryRadius === undefined) return zeroResult();
    const rW2 = args.secondaryRadius.to('m').scalar;
    const G = args.secondaryToShooterRatio ?? 0;
    return dualShooter(omegaWi, rW, iW, mB, rB, iB, rW2, G, vBi, omegaBi);
  }

  if (args.mode === 'compound') {
    if (args.secondaryRadius === undefined) return zeroResult();
    const rW2 = args.secondaryRadius.to('m').scalar;
    const G = args.secondaryToShooterRatio ?? 0;
    return compound(omegaWi, rW, iW, mB, rB, iB, rW2, G, vBi, omegaBi);
  }

  return singleHooded(omegaWi, rW, iW, mB, rB, iB, vBi, omegaBi);
}
