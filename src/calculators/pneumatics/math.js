import Qty from "js-quantities";
import { clampQty } from "common/tooling/quantities";

export function generatePressureTimeline(pistons, volume) {
  const pressures = [{ x: 0, y: Qty(125, "psi") }];
  const duration = Qty(2 * 60 + 30, "s");
  const dt = Qty(1, "s");
  let t = 0;
  const timeToFire = pistons.map((piston) => Qty(piston.period));

  if (volume.scalar == 0) return [];

  while (t < duration.scalar) {
    let totalCylWork = Qty(0, "J");
    pistons.forEach((p, i) => {
      if (!p.enabled) return;
      timeToFire[i] = timeToFire[i].sub(dt);
      const isFiring = timeToFire[i].scalar < 0;
      if (isFiring) {
        timeToFire[i] = Qty(p.period);
      }
      totalCylWork = totalCylWork.add(getCylinderWork(p, isFiring));
    });

    const newPressureDelta = getCompressorWork(dt)
      .sub(totalCylWork)
      .div(volume);
    const newPressure = pressures[pressures.length - 1].y.add(newPressureDelta);

    pressures.push({ x: t, y: clampQty(newPressure.to("psi"), 0, 125, false) });
    t += dt.scalar;
  }

  return pressures.map(({ x, y }) => ({ x, y: y.to("psi").scalar }));
}

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

function getCompressorWork(dt) {
  return getCompressorFlowRate(null).mul(Qty(1, "atm")).mul(dt);
}

function getCompressorFlowRate(pressure) {
  return Qty(0.3 / 60, "ft^3/s");
}
