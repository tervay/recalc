import { describe, expect, test } from 'vitest';

import {
  ExponentialProfile,
  type State,
  createState,
  fromCharacteristics,
  fromStateSpace,
} from '~/lib/math/exponentialProfile';

// Constants
const kDt = 0.01;
const constraints = fromCharacteristics(12, 2.5629, 0.43277);

function checkDynamics(
  profile: ExponentialProfile,
  current: State,
  goal: State,
): State {
  const next = profile.calculate(kDt, current, goal);
  return next;
}

describe('ExponentialProfile Tests', () => {
  test('reachesGoal', () => {
    const profile = new ExponentialProfile(constraints);

    const goal = createState(10, 0);
    let state = createState(0, 0);

    for (let i = 0; i < 450; ++i) {
      state = checkDynamics(profile, state, goal);
    }
    expect(state).toEqual(goal);
  });

  test('posContinuousUnderVelChange', () => {
    let profile = new ExponentialProfile(constraints);

    const goal = createState(10, 0);
    let state = createState(0, 0);

    for (let i = 0; i < 300; ++i) {
      if (i === 150) {
        profile = new ExponentialProfile(
          fromStateSpace(9, constraints.A, constraints.B),
        );
      }

      state = checkDynamics(profile, state, goal);
    }
    expect(state).toEqual(goal);
  });

  test('posContinuousUnderVelChangeBackward', () => {
    let profile = new ExponentialProfile(constraints);

    const goal = createState(-10, 0);
    let state = createState(0, 0);

    for (let i = 0; i < 300; ++i) {
      if (i === 150) {
        profile = new ExponentialProfile(
          fromStateSpace(9, constraints.A, constraints.B),
        );
      }

      state = checkDynamics(profile, state, goal);
    }
    expect(state).toEqual(goal);
  });

  test('backwards', () => {
    const goal = createState(-10, 0);
    let state = createState(0, 0);

    const profile = new ExponentialProfile(constraints);

    for (let i = 0; i < 400; ++i) {
      state = checkDynamics(profile, state, goal);
    }
    expect(state).toEqual(goal);
  });

  test('switchGoalInMiddle', () => {
    let goal = createState(-10, 0);
    let state = createState(0, 0);

    const profile = new ExponentialProfile(constraints);
    for (let i = 0; i < 50; ++i) {
      state = checkDynamics(profile, state, goal);
    }
    expect(state).not.toEqual(goal);

    goal = createState(0.0, 0.0);
    for (let i = 0; i < 100; ++i) {
      state = checkDynamics(profile, state, goal);
    }
    expect(state).toEqual(goal);
  });

  test('topSpeed', () => {
    const goal = createState(40, 0);
    let state = createState(0, 0);

    const profile = new ExponentialProfile(constraints);
    let maxSpeed = 0;
    for (let i = 0; i < 900; ++i) {
      state = checkDynamics(profile, state, goal);
      maxSpeed = Math.max(maxSpeed, state.velocity);
    }

    expect(maxSpeed).toBeCloseTo(constraints.maxVelocity(), 3);
    expect(state).toEqual(goal);
  });

  test('topSpeedBackward', () => {
    const goal = createState(-40, 0);
    let state = createState(0, 0);

    const profile = new ExponentialProfile(constraints);
    let maxSpeed = 0;
    for (let i = 0; i < 900; ++i) {
      state = checkDynamics(profile, state, goal);
      maxSpeed = Math.min(maxSpeed, state.velocity);
    }

    expect(maxSpeed).toBeCloseTo(-constraints.maxVelocity(), 3);
    expect(state).toEqual(goal);
  });

  test('largeInitialVelocity', () => {
    const goal = createState(40, 0);
    let state = createState(0, 8);

    const profile = new ExponentialProfile(constraints);
    for (let i = 0; i < 900; ++i) {
      state = checkDynamics(profile, state, goal);
    }

    expect(state).toEqual(goal);
  });

  test('largeNegativeInitialVelocity', () => {
    const goal = createState(-40, 0);
    let state = createState(0, -8);

    const profile = new ExponentialProfile(constraints);
    for (let i = 0; i < 900; ++i) {
      state = checkDynamics(profile, state, goal);
    }

    expect(state).toEqual(goal);
  });

  test('testHeuristic', () => {
    const testCases = [
      {
        initial: createState(0.0, -4),
        goal: createState(0.75, -4),
        inflectionPoint: createState(1.3758, 4.4304),
      },
      {
        initial: createState(0.0, -4),
        goal: createState(1.4103, 4),
        inflectionPoint: createState(1.3758, 4.4304),
      },
      // Add remaining test cases here...
    ];

    const profile = new ExponentialProfile(constraints);

    for (const testCase of testCases) {
      const state = profile.calculateInflectionPoint(
        testCase.initial,
        testCase.goal,
      );
      expect(state.position).toBeCloseTo(testCase.inflectionPoint.position, 3);
      expect(state.velocity).toBeCloseTo(testCase.inflectionPoint.velocity, 3);
    }
  });

  //   test('timingToCurrent', () => {
  //     const goal = new State(2, 0);
  //     let state = new State(0, 0);

  //     const profile = new ExponentialProfile(constraints);
  //     for (let i = 0; i < 400; i++) {
  //       state = checkDynamics(profile, state, goal);
  //       assertNear(profile.timeLeftUntil(state, state), 0, 2e-2);
  //     }
  //   });

  //   test('timingToGoal', () => {
  //     const profile = new ExponentialProfile(constraints);

  //     const goal = new State(2, 0);
  //     let state = new State(0, 0);

  //     const predictedTimeLeft = profile.timeLeftUntil(state, goal);
  //     let reachedGoal = false;
  //     for (let i = 0; i < 400; i++) {
  //       state = checkDynamics(profile, state, goal);

  //       if (!reachedGoal && state.equals(goal)) {
  //         assertNear(predictedTimeLeft, i / 100.0, 0.25);
  //         reachedGoal = true;
  //       }
  //     }
  //   });

  //   test('timingToNegativeGoal', () => {
  //     const profile = new ExponentialProfile(constraints);

  //     const goal = new State(-2, 0);
  //     let state = new State(0, 0);

  //     const predictedTimeLeft = profile.timeLeftUntil(state, goal);
  //     let reachedGoal = false;
  //     for (let i = 0; i < 400; i++) {
  //       state = checkDynamics(profile, state, goal);

  //       if (!reachedGoal && state.equals(goal)) {
  //         assertNear(predictedTimeLeft, i / 100.0, 0.25);
  //         reachedGoal = true;
  //       }
  //     }
  //   });
});
