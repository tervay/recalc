import Measurement from '~/lib/models/Measurement';
import type Motor from '~/lib/models/Motor';
import type Ratio from '~/lib/models/Ratio';
import { MotorRules } from '~/lib/rules';

export function generateProfile(
  targetDistance: Measurement,
  maxVelocity: Measurement,
  motor: Motor,
  efficiency: number,
  ratio: Ratio,
  mass: Measurement,
  statorLimit: Measurement,
  gravity: Measurement,
  wheelOrPulleyDiameter: Measurement,
  stopAtVelocity: Measurement | undefined = undefined,
  timeCutoff: Measurement = new Measurement(10, 's'),
) {
  console.log('targetDistance', targetDistance.to('m').format());
  console.log('maxVelocity', maxVelocity.to('m/s').format());
  console.log('motor', motor.freeSpeed.to('rpm').format());
  console.log('efficiency', efficiency);
  console.log('ratio', ratio.asNumber());
  console.log('mass', mass.to('kg').format());
  console.log('statorLimit', statorLimit.to('A').format());
  console.log('gravity', gravity.to('m/s^2').format());
  console.log('wheelOrPulleyDiameter', wheelOrPulleyDiameter.to('m').format());
  console.log('stopAtVelocity', stopAtVelocity?.to('m/s').format());
  console.log('timeCutoff', timeCutoff.to('s').format());
  console.log('----');

  if (
    statorLimit.lte(motor.freeCurrent) ||
    motor.quantity === 0 ||
    ratio.asNumber() === 0
  ) {
    const zerotxv = {
      t: new Measurement(0, 's'),
      x: new Measurement(0, 'm'),
      v: new Measurement(0, 'm/s'),
    };

    return {
      aLim: new Measurement(0, 'm/s^2'),
      aStop: new Measurement(0, 'm/s^2'),
      vLim: new Measurement(0, 'm/s'),
      vFree: new Measurement(0, 'm/s'),
      transitionTimes: {
        t_12: new Measurement(0, 's'),
        t_13: new Measurement(0, 's'),
        t_14: new Measurement(0, 's'),
      },
      phase1FinalCondition: zerotxv,
      phase2InitialCondition: zerotxv,
      phase2TransitionTimes: {
        t_23: new Measurement(0, 's'),
        t_24: new Measurement(0, 's'),
      },
      phase2FinalCondition: zerotxv,
      enterCoast: false,
      phase3InitialCondition: zerotxv,
      phase3FinalCondition: zerotxv,
      phase4InitialCondition: zerotxv,
      phase4FinalCondition: zerotxv,
      samples: [
        {
          t: new Measurement(0, 's'),
          x: new Measurement(0, 'm'),
          v: new Measurement(0, 'm/s'),
          motorRPM: new Measurement(0, 'rpm'),
          current: new Measurement(0, 'A'),
          torque: new Measurement(0, 'N*m'),
          power: new Measurement(0, 'W'),
          efficiency: new Measurement(0),
        },
      ],
    };
  }

  const r = wheelOrPulleyDiameter.div(2);

  const iLimMinusiFreeOveriStallMinusiFree = statorLimit
    .sub(motor.freeCurrent)
    .div(motor.stallCurrent.sub(motor.freeCurrent));

  const TLim = motor.stallTorque
    .mul(motor.quantity)
    .mul(efficiency / 100)
    .mul(iLimMinusiFreeOveriStallMinusiFree);

  const FLim = TLim.mul(ratio.asNumber()).div(r);
  const aLim = FLim.div(mass).sub(gravity);

  const aStop = aLim.add(gravity.mul(2));

  const wLim = motor.freeSpeed.mul(
    new Measurement(1).sub(iLimMinusiFreeOveriStallMinusiFree),
  );

  const vLim = wLim.mul(r).div(ratio.asNumber()).removeRad();

  const vFree = motor.freeSpeed
    .mul(r)
    .div(ratio.asNumber())
    .mul(
      new Measurement(1).sub(
        mass.mul(gravity).mul(r).div(motor.stallTorque.mul(ratio.asNumber())),
      ),
    )
    .removeRad();

  const actualTopSpeed = Measurement.min(vFree, maxVelocity);

  const transitionTimes = calculatePhase1Transitions({
    vLim,
    aLim,
    vMax2: actualTopSpeed,
    targetDistance,
    aStop,
  });

  const phase1FinalCondition = calculatePhase1FinalCondition({
    transitionTimes,
    aLim,
  });

  const enterExp =
    transitionTimes.t_12.lt(transitionTimes.t_13) &&
    transitionTimes.t_12.lt(transitionTimes.t_14);

  const phase2InitialCondition = calculatePhase2InitialCondition({
    enterExp,
    phase1FinalCondition,
  });

  const phase2TransitionTimes = calculatePhase2Transitions({
    aLim,
    vLim,
    vFree,
    vMax2: actualTopSpeed,
    enterExp,
    phase2InitialCondition,
    aStop,
    targetDistance,
  });

  const phase2FinalCondition = calculatePhase2FinalCondition({
    phase2InitialCondition,
    phase2TransitionTimes,
    vFree,
    aLim,
    vLim,
  });

  let enterCoast: boolean;
  if (enterExp) {
    if (
      phase2TransitionTimes.t_23 === undefined ||
      phase2TransitionTimes.t_24 === undefined
    ) {
      enterCoast = false;
    } else {
      enterCoast = phase2TransitionTimes.t_23.lt(phase2TransitionTimes.t_24);
    }
  } else {
    enterCoast = transitionTimes.t_13.lt(transitionTimes.t_14);
  }

  const phase3InitialCondition = calculatePhase3InitialCondition({
    enterCoast,
    enterExp,
    phase1TransitionTimes: transitionTimes,
    phase1FinalCondition,
    phase2FinalCondition,
  });

  const phase3FinalCondition = calculatePhase3FinalCondition({
    phase3InitialCondition,
    targetDistance,
    vMax2: actualTopSpeed,
    aStop,
  });

  const phase4InitialCondition = calculatePhase4InitialCondition({
    enterExp,
    enterCoast,
    phase1TransitionTimes: transitionTimes,
    phase1FinalCondition,
    phase2FinalCondition,
    phase3FinalCondition,
  });

  const phase4FinalCondition = calculatePhase4FinalCondition({
    phase4InitialCondition,
    aStop,
    targetDistance,
  });

  const samples: {
    t: Measurement;
    x: Measurement;
    v: Measurement;
    motorRPM: Measurement;
    current: Measurement;
    torque: Measurement;
    power: Measurement;
    efficiency: Measurement;
  }[] = [];
  let timeSec = 0;
  while (true) {
    const [x, v] = samplePoint({
      t: new Measurement(timeSec, 's'),
      enterExp,
      enterCoast,
      aLim,
      phase1FinalCondition,
      phase2FinalCondition,
      phase2InitialCondition,
      vFree,
      vLim,
      phase3FinalCondition,
      phase3InitialCondition,
      maxVelocity,
      phase4FinalCondition,
      phase4InitialCondition,
      aStop,
    });

    const motorRPM = v
      .mul(ratio.asNumber())
      .div(r)
      .mul(new Measurement(1, 'rad'));

    const motorState = new MotorRules(motor, statorLimit, {
      voltage: new Measurement(12, 'V'),
      rpm: motorRPM,
    }).solve();

    const current = motorState.current;
    const torque = motorState.torque;
    const power = motorState.power;
    const efficiency = motorState.efficiency;

    samples.push({
      t: new Measurement(timeSec, 's'),
      x,
      v,
      motorRPM,
      current,
      torque,
      power,
      efficiency,
    });

    if (
      x.gte(targetDistance) ||
      new Measurement(timeSec, 's').gte(phase4FinalCondition.t) ||
      new Measurement(timeSec, 's').gte(timeCutoff) ||
      (stopAtVelocity &&
        // arbitrary fix for it barely missing the target velocity at max speeds
        v.gte(stopAtVelocity.sub(new Measurement(0.01, 'in/s'))))
    ) {
      break;
    }

    timeSec += 0.01;
  }

  return {
    aLim,
    aStop,
    vLim,
    vFree,
    transitionTimes,
    phase1FinalCondition,
    phase2InitialCondition,
    phase2TransitionTimes,
    phase2FinalCondition,
    enterCoast,
    phase3InitialCondition,
    phase3FinalCondition,
    phase4InitialCondition,
    phase4FinalCondition,
    samples,
  };
}

function samplePoint({
  t,
  enterExp,
  enterCoast,
  aLim,
  vFree,
  vLim,
  aStop,
  maxVelocity,
  phase1FinalCondition,
  phase2InitialCondition,
  phase2FinalCondition,
  phase3InitialCondition,
  phase3FinalCondition,
  phase4InitialCondition,
  phase4FinalCondition,
}: {
  t: Measurement;
  enterExp: boolean;
  enterCoast: boolean;
  aLim: Measurement;
  vFree: Measurement;
  vLim: Measurement;
  aStop: Measurement;
  maxVelocity: Measurement;
  phase1FinalCondition: TimePositionVelocityState;
  phase2InitialCondition: Partial<TimePositionVelocityState>;
  phase2FinalCondition: Partial<TimePositionVelocityState>;
  phase3InitialCondition: Partial<TimePositionVelocityState>;
  phase3FinalCondition: Partial<TimePositionVelocityState>;
  phase4InitialCondition: TimePositionVelocityState;
  phase4FinalCondition: TimePositionVelocityState;
}): [Measurement, Measurement] {
  if (t.lte(new Measurement(0, 's'))) {
    return [new Measurement(0, 'm'), new Measurement(0, 'm/s')];
  }

  // if t gte t4f
  if (t.gte(phase4FinalCondition.t)) {
    return [phase4FinalCondition.x, phase4FinalCondition.v];
  }

  if (t.lte(phase1FinalCondition.t)) {
    return samplePhase1({ t, aLim });
  }

  if (enterExp) {
    if (enterCoast) {
      // 1 2 3 4
      const t2f = phase2FinalCondition.t;
      if (t.lte(t2f!)) {
        return samplePhase2({
          t,
          phase2InitialCondition,
          vFree,
          vLim,
          aLim,
        });
      }
      const t3f = phase3FinalCondition.t;
      if (t.lte(t3f!)) {
        return samplePhase3({
          t,
          phase3InitialCondition,
          vMax: maxVelocity,
        });
      }

      return samplePhase4({
        t,
        phase4InitialCondition,
        aStop,
      });
    }
    // 1 2 4
    const t2f = phase2FinalCondition.t;
    if (t.lte(t2f!)) {
      return samplePhase2({
        t,
        phase2InitialCondition,
        vFree,
        vLim,
        aLim,
      });
    }

    return samplePhase4({
      t,
      phase4InitialCondition: phase4InitialCondition,
      aStop,
    });
  }
  if (enterCoast) {
    // 1 3 4
    const t3f = phase3FinalCondition.t;
    if (t.lte(t3f!)) {
      return samplePhase3({
        t,
        phase3InitialCondition,
        vMax: maxVelocity,
      });
    }
    return samplePhase4({
      t,
      phase4InitialCondition,
      aStop,
    });
  }
  // 1 4
  return samplePhase4({
    t,
    phase4InitialCondition,
    aStop,
  });
}

function samplePhase1({
  t,
  aLim,
}: {
  t: Measurement;
  aLim: Measurement;
}): [Measurement, Measurement] {
  return [aLim.mul(t).mul(t).div(2), aLim.mul(t)];
}

function samplePhase2({
  t,
  phase2InitialCondition,
  vFree,
  vLim,
  aLim,
}: {
  t: Measurement;
  phase2InitialCondition: Partial<TimePositionVelocityState>;
  vFree: Measurement;
  vLim: Measurement;
  aLim: Measurement;
}): [Measurement, Measurement] {
  const xToSum: Measurement[] = [];
  xToSum.push(phase2InitialCondition.x!);
  xToSum.push(vFree.mul(t.sub(phase2InitialCondition.t!)));
  xToSum.push(
    vFree
      .sub(vLim)
      .mul(vFree.sub(vLim))
      .div(aLim)
      .mul(
        Math.exp(
          aLim
            .negate()
            .div(vFree.sub(vLim))
            .mul(t.sub(phase2InitialCondition.t!)).baseScalar,
        ) - 1,
      ),
  );

  // v_free - (v_free - v_lim)*Math.exp(-a_lim/(v_free-v_lim)*(t-t_20))
  const vToSum: Measurement[] = [];
  vToSum.push(vFree);
  const maybeAdd = vFree
    .sub(vLim)
    .mul(
      Math.exp(
        aLim.negate().div(vFree.sub(vLim)).mul(t.sub(phase2InitialCondition.t!))
          .baseScalar,
      ),
    )
    .negate();

  if (maybeAdd.abs().gte(new Measurement(0.001, 'm/s'))) {
    vToSum.push(maybeAdd);
  }

  return [
    xToSum.reduce((acc, curr) => acc.add(curr), new Measurement(0, 'm')),
    vToSum.reduce((acc, curr) => acc.add(curr), new Measurement(0, 'm/s')),
  ];
}

function samplePhase3({
  t,
  phase3InitialCondition,
  vMax,
}: {
  t: Measurement;
  phase3InitialCondition: Partial<TimePositionVelocityState>;
  vMax: Measurement;
}): [Measurement, Measurement] {
  return [
    phase3InitialCondition.x!.add(vMax.mul(t.sub(phase3InitialCondition.t!))),
    vMax,
  ];
}

function samplePhase4({
  t,
  phase4InitialCondition,
  aStop,
}: {
  t: Measurement;
  phase4InitialCondition: TimePositionVelocityState;
  aStop: Measurement;
}): [Measurement, Measurement] {
  return [
    phase4InitialCondition.x
      .add(phase4InitialCondition.v.mul(t.sub(phase4InitialCondition.t)))
      .sub(
        aStop
          .mul(t.sub(phase4InitialCondition.t))
          .mul(t.sub(phase4InitialCondition.t))
          .div(2),
      ),
    phase4InitialCondition.v.sub(aStop.mul(t.sub(phase4InitialCondition.t))),
  ];
}

function expDecelIntercept(
  v_free: Measurement,
  v_lim: Measurement,
  a_lim: Measurement,
  a_stop: Measurement,
  x_f: Measurement,
  x_20: Measurement,
): Measurement {
  // Convert all measurements to base units for calculations
  const A = v_free;
  const B = v_free.sub(v_lim).negate();
  const C = a_lim.div(v_free.sub(v_lim)).negate();
  const D = a_stop.mul(2);
  const Delta_X = x_f.sub(x_20);

  const root = new Measurement(
    newtonsMethod(
      (t) =>
        evaluateExp(A, B, C, D, Delta_X, new Measurement(t, 's')).to('m2/s2')
          .scalar,
      (t) =>
        evaluateExpDerivative(A, B, C, D, Delta_X, new Measurement(t, 's')).to(
          'm2/s3',
        ).scalar,
      0,
    ) ?? 0,
    's',
  );

  return root;
}

function evaluateExp(
  A: Measurement,
  B: Measurement,
  C: Measurement,
  D: Measurement,
  Delta_X: Measurement,
  t: Measurement,
): Measurement {
  const toSum: Measurement[] = [];
  const exp2CT = Math.exp(C.mul(t).mul(2).scalar);
  if (isFinite(exp2CT)) {
    toSum.push(B.mul(B).mul(exp2CT));
  }

  // (D*B/C + 2*A*B)*Math.exp(C*t)
  const expCT = Math.exp(C.mul(t).scalar);
  if (isFinite(expCT)) {
    try {
      toSum.push(
        D.mul(B)
          .div(C)
          .add(A.mul(B).mul(2))
          .mul(expCT),
      );
    } catch {
      // Skip if division produces invalid value
    }
  }

  // A*D*t
  toSum.push(A.mul(D).mul(t));

  // - D*B/C
  try {
    toSum.push(D.mul(B).div(C).negate());
  } catch {
    // Skip if division produces invalid value
  }

  // - Delta_X*D
  toSum.push(Delta_X.mul(D).negate());

  // A**2
  toSum.push(A.mul(A));

  return toSum.reduce(
    (acc, curr) => {
      try {
        if (isFinite(curr.scalar)) {
          return acc.add(curr);
        }
      } catch {
        // Skip invalid term
      }
      return acc;
    },
    new Measurement(0, 'm2/s2'),
  );
}

function evaluateExpDerivative(
  A: Measurement,
  B: Measurement,
  C: Measurement,
  D: Measurement,
  Delta_X: Measurement,
  t: Measurement,
): Measurement {
  const toSum: Measurement[] = [];

  // 2*B**2*C*Math.exp(2*C*t)
  const exp = Math.exp(C.mul(t).mul(2).baseScalar);
  if (isFinite(exp)) {
    toSum.push(B.mul(B).mul(C).mul(2).mul(exp));
  }

  // (B*D/C + 2*A*B)*C*Math.exp(C*t)
  const expCT = Math.exp(C.mul(t).scalar);
  if (isFinite(expCT)) {
    try {
      toSum.push(
        B.mul(D)
          .div(C)
          .add(A.mul(B).mul(2))
          .mul(C)
          .mul(expCT),
      );
    } catch {
      // Skip if division produces invalid value
    }
  }

  // A*D
  toSum.push(A.mul(D));

  return toSum.reduce(
    (acc, curr) => {
      if (curr.abs().gte(new Measurement(0.001, 'm2/s3'))) {
        return acc.add(curr);
      }
      return acc;
    },
    new Measurement(0, 'm2/s3'),
  );
}

function newtonsMethod(
  f: (x: number) => number,
  fPrime: (x: number) => number,
  initialGuess: number,
  tolerance: number = 1e-9,
  maxIterations: number = 100,
): number | null {
  let x = initialGuess;

  for (let i = 0; i < maxIterations; i++) {
    const fx = f(x);
    const fpx = fPrime(x);

    if (Math.abs(fpx) < 1e-12) {
      console.warn('Derivative too close to zero. Stopping.');
      return null;
    }

    const nextX = x - fx / fpx;

    if (Math.abs(nextX - x) < tolerance) {
      console.log('Converged in', i, 'iterations');
      return nextX;
    }

    x = nextX;
  }

  console.warn('Maximum iterations reached without convergence.');
  return null;
}

interface Phase1TransitionTimes {
  t_12: Measurement;
  t_13: Measurement;
  t_14: Measurement;
}

interface TimePositionVelocityState {
  t: Measurement;
  x: Measurement;
  v: Measurement;
}

function calculatePhase1Transitions({
  vLim,
  aLim,
  vMax2,
  targetDistance,
  aStop,
}: {
  vLim: Measurement;
  aLim: Measurement;
  vMax2: Measurement;
  targetDistance: Measurement;
  aStop: Measurement;
}): Phase1TransitionTimes {
  const toSqrt = targetDistance.mul(2).div(aLim.add(aLim.mul(aLim).div(aStop)));
  const t14 = new Measurement(Math.sqrt(toSqrt.to('s2').scalar), 's');

  return {
    t_12: vLim.div(aLim),
    t_13: vMax2.div(aLim),
    t_14: t14,
  };
}

function calculatePhase1FinalCondition({
  transitionTimes,
  aLim,
}: {
  transitionTimes: Phase1TransitionTimes;
  aLim: Measurement;
}): TimePositionVelocityState {
  const { t_12, t_13, t_14 } = transitionTimes;

  const t1f = Measurement.minAll([t_12, t_13, t_14]);
  const x1f = aLim.mul(1 / 2).mul(t1f.mul(t1f));
  const v1f = aLim.mul(t1f);

  return {
    t: t1f,
    x: x1f,
    v: v1f,
  };
}

function calculatePhase2InitialCondition({
  enterExp,
  phase1FinalCondition,
}: {
  enterExp: boolean;
  phase1FinalCondition: TimePositionVelocityState;
}): Partial<TimePositionVelocityState> {
  if (!enterExp) {
    return {
      t: undefined,
      x: undefined,
      v: undefined,
    };
  }

  const t20 = phase1FinalCondition.t;
  const x20 = phase1FinalCondition.x;
  const v20 = phase1FinalCondition.v;

  return {
    t: t20,
    x: x20,
    v: v20,
  };
}

interface Phase2TransitionTimes {
  t_23: Measurement;
  t_24: Measurement;
}

function calculatePhase2Transitions({
  aLim,
  vLim,
  vFree,
  vMax2,
  enterExp,
  phase2InitialCondition,
  aStop,
  targetDistance,
}: {
  aLim: Measurement;
  vLim: Measurement;
  vFree: Measurement;
  vMax2: Measurement;
  enterExp: boolean;
  phase2InitialCondition: Partial<TimePositionVelocityState>;
  aStop: Measurement;
  targetDistance: Measurement;
}): Partial<Phase2TransitionTimes> {
  let dt23: Measurement | undefined;
  let dt24: Measurement | undefined;

  if (!enterExp) {
    dt23 = undefined;
    dt24 = undefined;
  } else {
    // dt23
    const numerator = vFree.sub(vLim).negate().div(aLim);
    const denominator = vFree.sub(vMax2).div(vFree.sub(vLim)).scalar;

    if (denominator <= 0) {
      dt23 = undefined;
    } else {
      dt23 = numerator.mul(Math.log(denominator));
    }

    // dt24
    dt24 = expDecelIntercept(
      vFree,
      vLim,
      aLim,
      aStop,
      targetDistance,
      phase2InitialCondition.x!,
    );
  }

  return {
    t_23: dt23,
    t_24: dt24,
  };
}

function calculatePhase2FinalCondition({
  phase2InitialCondition,
  phase2TransitionTimes,
  vFree,
  aLim,
  vLim,
}: {
  phase2InitialCondition: Partial<TimePositionVelocityState>;
  phase2TransitionTimes: Partial<Phase2TransitionTimes>;
  vFree: Measurement;
  aLim: Measurement;
  vLim: Measurement;
}): Partial<TimePositionVelocityState> {
  if (
    phase2InitialCondition.t === undefined ||
    phase2InitialCondition.x === undefined ||
    phase2InitialCondition.v === undefined
  ) {
    return {
      t: undefined,
      x: undefined,
      v: undefined,
    };
  }

  let t2f: Measurement;

  if (phase2TransitionTimes.t_23 === undefined) {
    t2f = phase2InitialCondition.t.add(phase2TransitionTimes.t_24!);
  } else {
    t2f = phase2InitialCondition.t.add(
      Measurement.min(phase2TransitionTimes.t_23, phase2TransitionTimes.t_24!),
    );
  }
  // x2f
  let x2f = phase2InitialCondition.x.add(
    vFree.mul(t2f.sub(phase2InitialCondition.t)),
  );
  const toExp = aLim.negate().div(vFree.sub(vLim)).mul(t2f).baseScalar;
  const vDiff = vFree.sub(vLim);
  const multiplier = vDiff.mul(vDiff).div(aLim);
  x2f = x2f.add(multiplier.mul(Math.exp(toExp) - 1));

  // v2f
  let v2f: Measurement = vFree;
  const toExpV = aLim.negate().div(vFree.sub(vLim)).mul(t2f).baseScalar;
  v2f = v2f.sub(vDiff.mul(Math.exp(toExpV)));

  return {
    t: t2f,
    x: x2f,
    v: v2f,
  };
}

function calculatePhase3InitialCondition({
  enterCoast,
  enterExp,
  phase1TransitionTimes,
  phase1FinalCondition,
  phase2FinalCondition,
}: {
  enterCoast: boolean;
  enterExp: boolean;
  phase1TransitionTimes: Phase1TransitionTimes;
  phase1FinalCondition: TimePositionVelocityState;
  phase2FinalCondition: Partial<TimePositionVelocityState>;
}): Partial<TimePositionVelocityState> {
  let t30: Measurement | undefined;
  if (enterCoast) {
    if (enterExp) {
      t30 = phase2FinalCondition.t;
    } else {
      t30 = phase1TransitionTimes.t_13;
    }
  } else {
    t30 = undefined;
  }

  let x30: Measurement | undefined;
  if (enterCoast) {
    if (enterExp) {
      x30 = phase2FinalCondition.x;
    } else {
      x30 = phase1FinalCondition.x;
    }
  } else {
    x30 = undefined;
  }

  let v30: Measurement | undefined;
  if (enterCoast) {
    if (enterExp) {
      v30 = phase2FinalCondition.v;
    } else {
      v30 = phase1FinalCondition.v;
    }
  } else {
    v30 = undefined;
  }

  return {
    t: t30,
    x: x30,
    v: v30,
  };
}

function calculatePhase3FinalCondition({
  phase3InitialCondition,
  targetDistance,
  vMax2,
  aStop,
}: {
  phase3InitialCondition: Partial<TimePositionVelocityState>;
  targetDistance: Measurement;
  vMax2: Measurement;
  aStop: Measurement;
}): Partial<TimePositionVelocityState> {
  if (
    phase3InitialCondition.t === undefined ||
    phase3InitialCondition.x === undefined ||
    phase3InitialCondition.v === undefined
  ) {
    return {
      t: undefined,
      x: undefined,
      v: undefined,
    };
  }

  const dt34 = targetDistance
    .sub(phase3InitialCondition.x)
    .div(vMax2)
    .sub(vMax2.div(2).div(aStop));

  const t3f = dt34.add(phase3InitialCondition.t);
  const x3f = phase3InitialCondition.x.add(vMax2.mul(dt34));

  return {
    t: t3f,
    x: x3f,
    v: vMax2,
  };
}

function calculatePhase4InitialCondition({
  enterExp,
  enterCoast,
  phase1TransitionTimes,
  phase1FinalCondition,
  phase2FinalCondition,
  phase3FinalCondition,
}: {
  enterExp: boolean;
  enterCoast: boolean;
  phase1TransitionTimes: Phase1TransitionTimes;
  phase1FinalCondition: TimePositionVelocityState;
  phase2FinalCondition: Partial<TimePositionVelocityState>;
  phase3FinalCondition: Partial<TimePositionVelocityState>;
}): TimePositionVelocityState {
  let t40: Measurement;
  let x40: Measurement;
  let v40: Measurement;

  if (enterCoast) {
    t40 = phase3FinalCondition.t!;
  } else {
    if (enterExp) {
      t40 = phase2FinalCondition.t!;
    } else {
      t40 = phase1TransitionTimes.t_14;
    }
  }

  if (enterCoast) {
    x40 = phase3FinalCondition.x!;
  } else {
    if (enterExp) {
      x40 = phase2FinalCondition.x!;
    } else {
      x40 = phase1FinalCondition.x;
    }
  }

  if (enterCoast) {
    v40 = phase3FinalCondition.v!;
  } else {
    if (enterExp) {
      v40 = phase2FinalCondition.v!;
    } else {
      v40 = phase1FinalCondition.v;
    }
  }

  return {
    t: t40,
    x: x40,
    v: v40,
  };
}

function calculatePhase4FinalCondition({
  phase4InitialCondition,
  aStop,
  targetDistance,
}: {
  phase4InitialCondition: TimePositionVelocityState;
  aStop: Measurement;
  targetDistance: Measurement;
}): TimePositionVelocityState {
  const t4f = phase4InitialCondition.t.add(phase4InitialCondition.v.div(aStop));

  const x4f = targetDistance;
  const v4f = new Measurement(0, 'm/s');

  return {
    t: t4f,
    x: x4f,
    v: v4f,
  };
}
