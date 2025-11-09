import { SimpleBelt } from "common/models/Belt";
import Measurement from "common/models/Measurement";
import { SimplePulley } from "common/models/Pulley";
import type Pulley from "common/models/Pulley";
import {
  debugAndReturn,
  useDebugger,
  useFileLogger,
  useFunctionLogger,
} from "common/tooling/logging";
import { roundToNearestMulitple } from "common/tooling/util";

const fileLogger = useFileLogger("Belts::math");

export function calculateDistance(
  p1: SimplePulley,
  p2: SimplePulley,
  belt: SimpleBelt,
): Measurement {
  const logger = useFunctionLogger(fileLogger, "calculateDistance", {
    p1,
    p2,
    belt,
  });
  const debug = useDebugger(logger);

  const b = belt.length
    .mul(2)
    .sub(p1.pitchDiameter.add(p2.pitchDiameter).mul(Math.PI));
  debug({ b });

  const pulleyDiff = p1.pitchDiameter.sub(p2.pitchDiameter).abs();
  debug({ pulleyDiff });

  const toSqrt = b.mul(b).sub(pulleyDiff.mul(pulleyDiff).mul(8));
  debug({ toSqrt });

  if (toSqrt.lte(new Measurement(0, "in^2"))) {
    logger().fail("Returning early");
    return new Measurement(0, "in");
  }

  const sqrted = new Measurement(
    Math.sqrt(toSqrt.scalar),
    toSqrt.units().replace("2", "1"),
  );
  debug({ sqrted });

  return debugAndReturn(b.add(sqrted).div(8), debug);
}

export function teethInMesh(
  p1: SimplePulley,
  p2: SimplePulley,
  center: Measurement,
  pulleyToUse: SimplePulley,
): number {
  const logger = useFunctionLogger(fileLogger, "teethInMesh", {
    p1,
    p2,
    center,
    pulleyToUse,
  });
  if (center.scalar === 0 || pulleyToUse.pitch.scalar === 0) {
    logger().fail("center is zero");
    return 0;
  }

  let mode: "larger" | "smaller";
  if (p1.eq(pulleyToUse)) {
    if (p1.teeth > p2.teeth) {
      mode = "larger";
    } else {
      mode = "smaller";
    }
  } else {
    if (p1.teeth > p2.teeth) {
      mode = "smaller";
    } else {
      mode = "larger";
    }
  }

  const P1 = p1.pitchDiameter;
  const P2 = p2.pitchDiameter;
  const d = P1.sub(P2).div(2).abs();
  const a = Math.asin(d.to("in").scalar / center.to("in").scalar);

  if (Number.isNaN(a)) {
    return 0;
  }

  if (mode === "larger") {
    const cl2 = pulleyToUse.pitchDiameter
      .mul(90 - a)
      .mul(Math.PI)
      .div(180);
    return Math.floor(cl2.div(pulleyToUse.pitch).scalar);
  } else {
    const cl2 = pulleyToUse.pitchDiameter
      .mul(90 + a)
      .mul(Math.PI)
      .div(180);
    return Math.floor(cl2.div(pulleyToUse.pitch).scalar);
  }
}

export function getTIMFactor(teethInMesh: number): number {
  if (teethInMesh >= 6) {
    return 1.0;
  } else if (teethInMesh > 5) {
    return 0.8;
  } else if (teethInMesh > 4) {
    return 0.6;
  } else if (teethInMesh > 3) {
    return 0.4;
  } else {
    return 0.2;
  }
}

export function approximateBeltPitchLength(
  p1: SimplePulley,
  p2: SimplePulley,
  desiredCenter: Measurement,
): Measurement {
  const t1 = desiredCenter.mul(2);
  const t2 = p1.pitchDiameter.add(p2.pitchDiameter).mul(1.57);
  const t3Numerator = p1.pitchDiameter
    .sub(p2.pitchDiameter)
    .mul(p1.pitchDiameter.sub(p2.pitchDiameter));
  const t3Denominator = desiredCenter.mul(4);

  return t1.add(t2).add(t3Numerator.div(t3Denominator));
}

type Result = {
  belt: SimpleBelt;
  distance: Measurement;
};
export type ClosestCentersResult = {
  smaller: Result;
  larger: Result;
};
export function calculateClosestCenters(
  p1: SimplePulley,
  p2: SimplePulley,
  desiredCenter: Measurement,
  multipleOf: number,
): ClosestCentersResult {
  if (
    [
      p1.pitch.scalar,
      p1.teeth,
      p2.pitch.scalar,
      p2.teeth,
      desiredCenter.scalar,
      multipleOf,
    ].includes(0.0)
  ) {
    return {
      larger: {
        belt: new SimpleBelt(0, p1.pitch),
        distance: new Measurement(0, "mm"),
      },
      smaller: {
        belt: new SimpleBelt(0, p1.pitch),
        distance: new Measurement(0, "mm"),
      },
    };
  }

  const pl = approximateBeltPitchLength(p1, p2, desiredCenter);
  const largerTeeth = roundToNearestMulitple(
    pl.div(p1.pitch).scalar,
    multipleOf,
  );
  const largerBelt = new SimpleBelt(largerTeeth, p1.pitch);

  const smallerTeeth = largerTeeth - multipleOf;
  const smallerBelt = new SimpleBelt(smallerTeeth, p1.pitch);

  return {
    larger: {
      belt: largerBelt,
      distance: calculateDistance(p1, p2, largerBelt),
    },
    smaller: {
      belt: smallerBelt,
      distance: calculateDistance(p1, p2, smallerBelt),
    },
  };
}

export function calculateDistanceBetweenPulleys(
  p1: SimplePulley,
  p2: SimplePulley,
  ccDistance: Measurement,
): Measurement {
  return ccDistance.sub(p1.pitchDiameter.div(2)).sub(p2.pitchDiameter.div(2));
}
