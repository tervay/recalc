import * as z from 'zod';

import Measurement, { type MeasurementDict } from '~/lib/models/Measurement';
import Motor, { type MotorDict } from '~/lib/models/Motor';
import { initWpilibc } from '~/lib/wpilib/wpilibc';

const SIM_TIMESTEP_SECONDS = 0.0001;

// A zero stator limit pins the applied voltage at back-EMF, so the sweep never
// accelerates and only this cap ends it. A normal curve takes a few hundred
// iterations.
const MAX_ITERATIONS = 50_000;

const DECIMATION = 1;

// Only sets sample density, not the steady-state curve.
const SWEEP_INERTIA_KG_M2 = 0.1 * (0.95 * 0.0254) ** 2.0;

export interface WpilibMotorSimState {
  angularVelocityRPM: number;
  currentDrawAmps: number;
  torqueNewtonMeters: number;
  efficiency: number;
}

// The embind boundary is untyped, so validate rather than cast.
const wasmRowSchema = z.object({
  angularVelocityRadPerSec: z.number(),
  statorCurrentDrawAmps: z.number(),
  torqueNewtonMeters: z.number(),
  efficiency: z.number(),
});

const wasmRowsSchema = z.array(wasmRowSchema);

/**
 * Sweeps a motor from stall to free speed in WPILib's `DCMotorSim`.
 *
 * Named parameters on purpose: the voltages and limits are all
 * `MeasurementDict`, so a positional signature lets callers transpose them
 * without any type error.
 */
export async function generateMotorCurve({
  motor: motor_,
  statorLimit: statorLimit_,
  supplyLimit: supplyLimit_,
  statorVoltage: statorVoltage_,
  supplyVoltage: supplyVoltage_,
}: {
  motor: MotorDict;
  statorLimit: MeasurementDict;
  supplyLimit: MeasurementDict;
  statorVoltage: MeasurementDict;
  supplyVoltage: MeasurementDict;
}): Promise<WpilibMotorSimState[]> {
  const wpilibc = await initWpilibc();

  const motor = Motor.fromDict(motor_);
  const statorLimit = Measurement.fromDict(statorLimit_);
  const supplyLimit = Measurement.fromDict(supplyLimit_);
  const statorVoltage = Measurement.fromDict(statorVoltage_);
  const supplyVoltage = Measurement.fromDict(supplyVoltage_);

  const wasmMotor = motor.toWpilibMotor();
  try {
    const rows = wasmRowsSchema.parse(
      wpilibc.simulateMotorCurve(
        wasmMotor,
        SWEEP_INERTIA_KG_M2,
        statorLimit.to('A').scalar * motor.quantity,
        supplyLimit.to('A').scalar * motor.quantity,
        statorVoltage.to('V').scalar,
        supplyVoltage.to('V').scalar,
        SIM_TIMESTEP_SECONDS,
        DECIMATION,
        MAX_ITERATIONS,
      ),
    );

    return rows.map((row) => ({
      angularVelocityRPM: new Measurement(
        row.angularVelocityRadPerSec,
        'rad/s',
      ).to('rpm').scalar,
      currentDrawAmps: row.statorCurrentDrawAmps,
      torqueNewtonMeters: row.torqueNewtonMeters,
      efficiency: row.efficiency,
    }));
  } finally {
    wasmMotor.delete();
  }
}
