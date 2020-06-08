import { clampQty } from "common/tooling/quantities";
import Qty from "js-quantities";

export function generatePressureTimeline(pistons, volume, compressor) {
  const pressures = [{ x: 0, y: Qty(115, "psi") }];
  const duration = Qty(2 * 60 + 30, "s");
  const dt = Qty(1, "s");
  let t = 0;
  const timeToFire = pistons.map((piston) => Qty(piston.period));
  let timeCompressorActive = 0;

  if (volume.scalar == 0) return { timeline: [], dutyCycle: 0 };

  let compressorOn = false;

  while (t < duration.scalar) {
    let totalCylWork = Qty(0, "J");
    pistons.forEach((p, i) => {
      if (!p.enabled) return;
      if (p.period.scalar === 0) return;
      timeToFire[i] = timeToFire[i].sub(dt);
      const isFiring = timeToFire[i].scalar < 0;
      if (isFiring) {
        timeToFire[i] = Qty(p.period);
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
//     const timeline = generatePressureTimeline(pistons, Qty(val, "ml"));
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
  const t1 = piston.diameter
    .mul(piston.diameter)
    .mul(Math.PI / 4)
    .mul(piston.pushPressure);
  const t2 = piston.diameter
    .mul(piston.diameter)
    .sub(piston.rodDiameter.mul(piston.rodDiameter));
  const t3 = t2.mul(Math.PI / 4).mul(piston.pullPressure);
  return t1
    .add(t3)
    .mul(piston.strokeLength)
    .mul(isFiring ? 1 : 0);
}

function getCompressorWork(compressor, pressure, dt, compressorOn) {
  if (!compressorOn) return Qty(0, "J");

  return getCompressorFlowRate(compressor, pressure).mul(Qty(1, "atm")).mul(dt);
}

function getCompressorFlowRate(compressor, pressure) {
  return compressor.cfmFn(pressure);
}
