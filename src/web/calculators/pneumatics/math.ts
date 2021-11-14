import Compressor, {
  CompressorDict,
  DISABLE_AT_PSI,
  ENABLE_AT_PSI,
} from "common/models/Compressor";
import Measurement from "common/models/Measurement";
import PistonList, { PistonListDict } from "common/models/PistonList";

type Timeline = { x: number; y: number }[];
type TimelineAndDutyCycle = {
  timeline: Timeline;
  dutyCycle: number;
};

export function generatePressureTimeline(
  pistonList: PistonList,
  volume: Measurement,
  compressor: Compressor
): TimelineAndDutyCycle {
  if (volume.scalar === 0) {
    return { timeline: [], dutyCycle: 0 };
  }

  const pressures = [{ x: 0, y: new Measurement(115, "psi") }];
  const duration = new Measurement(2 * 60 + 30, "s");
  const dt = new Measurement(1, "s");
  let t = new Measurement(0, "s"),
    timeCompressorActive = new Measurement(0, "s"),
    compressorOn = false;

  const remainingTimeToFire = pistonList.pistons.map((p) => p.period.copy());

  while (t.lt(duration)) {
    const previousPressure = pressures[pressures.length - 1].y;
    let totalCylinderWork = new Measurement(0, "J");
    pistonList.pistons.forEach((p, i) => {
      if (!p.enabled || p.period.eq(new Measurement(0, "s"))) {
        return;
      }

      remainingTimeToFire[i] = remainingTimeToFire[i].sub(dt);
      if (remainingTimeToFire[i].lt(new Measurement(0, "s"))) {
        remainingTimeToFire[i] = p.period.copy().sub(dt);
        totalCylinderWork = totalCylinderWork.add(
          p.toggleStateAndGetWorkFromIt(previousPressure)
        );
      }
    });

    if (compressorOn && previousPressure.gte(DISABLE_AT_PSI)) {
      compressorOn = false;
    } else if (!compressorOn && previousPressure.lte(ENABLE_AT_PSI)) {
      compressorOn = true;
    }

    if (compressorOn) {
      timeCompressorActive = timeCompressorActive.add(dt);
    }

    const newPressureDelta = (
      compressorOn
        ? compressor.getWork(previousPressure, dt)
        : new Measurement(0, "J")
    )
      .sub(totalCylinderWork)
      .div(volume);

    const newPressure = previousPressure.add(newPressureDelta);
    pressures.push({
      x: t.to("s").scalar,
      y: newPressure.clamp(
        new Measurement(0, "psi"),
        new Measurement(115, "psi")
      ),
    });

    t = t.add(dt);
  }

  return {
    timeline: pressures.map(({ x, y }) => ({ x: x, y: y.to("psi").scalar })),
    dutyCycle: timeCompressorActive.div(duration).scalar * 100,
  };
}

export function getRecommendedTanks(
  pistonList_: PistonListDict,
  compressor_: CompressorDict
): number {
  const pistonList = PistonList.fromDict(pistonList_);
  const compressor = Compressor.fromDict(compressor_);

  const step = 574;
  let val = step;

  while (true) {
    const timeline = generatePressureTimeline(
      pistonList,
      new Measurement(val, "ml"),
      compressor
    );

    const lowestPressure = timeline.timeline.reduce((prev, curr) =>
      prev.y < curr.y ? prev : curr
    );

    if (lowestPressure.y < 20) {
      val += step;
    } else {
      return val / step;
    }
  }
}
