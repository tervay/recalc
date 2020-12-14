import Measurement from "common/models/Measurement";
import { clampQty } from "common/tooling/quantities";

export function generatePressureTimeline(pistons, volume, compressor) {
  if (volume.scalar === 0) {
    return { timeline: [], dutyCycle: 0 };
  }

  const pressures = [{ x: 0, y: new Measurement(115, "psi") }];
  const duration = new Measurement(2 * 60 + 30, "s");
  const dt = new Measurement(1, "s");
  let t = 0;
  const timeToFire = pistons.map((piston) => piston.period.copy());
  let timeCompressorActive = 0;
  let compressorOn = false;

  while (t < duration.scalar) {
    let totalCylWork = new Measurement(0, "J");
    pistons.forEach((p, i) => {
      if (!p.enabled) return;
      if (p.period.scalar === 0) return;
      timeToFire[i] = timeToFire[i].sub(dt);
      const isFiring = timeToFire[i].scalar < 0;
      if (isFiring) {
        timeToFire[i] = p.period.copy();
      }
      totalCylWork = totalCylWork.add(getCylinderWork(p, isFiring));
    });

    const prevPressure = pressures[pressures.length - 1].y;

    if (compressorOn && prevPressure.to("psi").scalar >= 115) {
      compressorOn = false;
    } else if (!compressorOn && prevPressure.to("psi").scalar <= 95) {
      compressorOn = true;
    }

    if (compressorOn) {
      timeCompressorActive += dt.scalar;
    }

    const newPressureDelta = getCompressorWork(
      compressor,
      prevPressure,
      dt,
      compressorOn
    )
      .sub(totalCylWork)
      .div(volume);

    const newPressure = prevPressure.add(newPressureDelta);

    pressures.push({ x: t, y: clampQty(newPressure.to("psi"), 0, 115, false) });
    t += dt.scalar;
  }

  return {
    timeline: pressures.map(({ x, y }) => ({ x, y: y.to("psi").scalar })),
    dutyCycle: (timeCompressorActive / duration.scalar) * 100,
  };
}

// export function getRecommendedTanks(pistons) {
//   const step = 600;
//   let val = step;

//   while (true) {
//     const timeline = generatePressureTimeline(pistons, new Qty(val, "ml"));
//     const minPressure = timeline.reduce((prev, curr) =>
//       prev.y < curr.y ? prev : curr
//     );
//     if (minPressure.y < 20) {
//       val += step;
//     } else {
//       return val / step;
//     }
//   }
// }

function getCylinderWork(piston, isFiring) {
  const t1 = piston.bore
    .mul(piston.bore)
    .mul(Math.PI / 4)
    .mul(piston.pushPressure);
  const t2 = piston.bore
    .mul(piston.bore)
    .sub(piston.rodDiameter.mul(piston.rodDiameter));
  const t3 = t2.mul(Math.PI / 4).mul(piston.pullPressure);
  return t1
    .add(t3)
    .mul(piston.strokeLength)
    .mul(isFiring ? 1 : 0);
}

export function getCompressorWork(compressor, pressure, dt, compressorOn) {
  if (!compressorOn) return new Measurement(0, "J");

  return getCompressorFlowRate(compressor, pressure)
    .mul(new Measurement(1, "atm"))
    .mul(dt);
}

function getCompressorFlowRate(compressor, pressure) {
  return compressor.cfmFn(pressure);
}
