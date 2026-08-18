import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import IOLine from '~/components/recalc/blocks';
import CalcHeading from '~/components/recalc/calcHeading';
import { MeasurementInput } from '~/components/recalc/io/measurement';
import { MotorNameSelect } from '~/components/recalc/io/motor';
import MotorTable from '~/components/recalc/motorTable';
import { type ChartConfig, ChartContainer } from '~/components/ui/chart';
import { useQueryParams, useSerializedState } from '~/lib/hooks';
import { buildCalculatorApp, buildJsonLd, buildWebPage } from '~/lib/jsonld';
import type * as MotorsWorker from '~/lib/math/motors.worker';
import Measurement from '~/lib/models/Measurement';
import Motor, { ALL_MOTORS } from '~/lib/models/Motor';
import { buildMeta, pageUrl } from '~/lib/seo';
import { MeasurementParam, StringParam } from '~/lib/types/queryParams';

const MOTORS_PATH = '/motors';
const MOTORS_TITLE = 'FRC Motor Comparison & Specs | ReCalc';
const MOTORS_NAME = 'Motors Reference';
const MOTORS_DESCRIPTION =
  'Compare FRC motor specifications and performance curves. View stall torque, free speed, efficiency, and power curves for common FRC motors.';

export function meta() {
  return [
    ...buildMeta({
      path: MOTORS_PATH,
      title: MOTORS_TITLE,
      description: MOTORS_DESCRIPTION,
    }),
    {
      'script:ld+json': buildJsonLd(
        buildWebPage({
          url: pageUrl(MOTORS_PATH),
          name: MOTORS_NAME,
          description: MOTORS_DESCRIPTION,
          breadcrumbLabel: MOTORS_NAME,
        }),
        buildCalculatorApp({
          url: pageUrl(MOTORS_PATH),
          name: MOTORS_NAME,
          description: MOTORS_DESCRIPTION,
        }),
      ),
    },
  ];
}

const DEFAULT_PARAMS = {
  motor: StringParam.withDefault(ALL_MOTORS[0].name),
  statorLimit: MeasurementParam.withDefault(new Measurement(90, 'A')),
  supplyLimit: MeasurementParam.withDefault(new Measurement(60, 'A')),
  supplyVoltage: MeasurementParam.withDefault(new Measurement(12, 'V')),
  statorVoltage: MeasurementParam.withDefault(new Measurement(12, 'V')),
};

const CHART_CONFIG = {
  currentDrawAmps: { label: 'Current (A)', color: 'var(--chart-1)' },
  torqueNewtonMeters: { label: 'Torque (N·m)', color: 'var(--chart-2)' },
  efficiencyPercent: { label: 'Efficiency (%)', color: 'var(--chart-3)' },
} satisfies ChartConfig;

// Constructed lazily (not at module scope) so importing this route module
// never touches the `Worker` global — required for prerendering, where the
// route component is rendered in Node and `Worker` does not exist. Every
// call site below is inside a useEffect, so the getter is only ever invoked
// client-side.
function createWorker() {
  return new ComlinkWorker<typeof MotorsWorker>(
    new URL('../lib/math/motors.worker', import.meta.url),
    {
      type: 'module',
    },
  );
}

let workerInstance: ReturnType<typeof createWorker> | undefined;

function getWorker() {
  workerInstance ??= createWorker();
  return workerInstance;
}

type WpilibMotorSimState = MotorsWorker.WpilibMotorSimState;

export default function Motors() {
  const queryParams = useQueryParams(DEFAULT_PARAMS);

  const [selectedMotor, setSelectedMotor] = useState(queryParams.motor);
  const [statorLimit, setStatorLimit] = useState(queryParams.statorLimit);
  const [supplyLimit, setSupplyLimit] = useState(queryParams.supplyLimit);
  const [supplyVoltage, setSupplyVoltage] = useState(queryParams.supplyVoltage);
  const [statorVoltage, setStatorVoltage] = useState(queryParams.statorVoltage);

  const [workerWpilibSimStates, setWorkerWpilibSimStates] = useState<
    WpilibMotorSimState[]
  >([]);

  const serializedState = useSerializedState(DEFAULT_PARAMS, {
    motor: selectedMotor,
    statorLimit,
    supplyLimit,
    supplyVoltage,
    statorVoltage,
  });

  useEffect(() => {
    setWorkerWpilibSimStates([]);
    getWorker()
      .generateMotorCurve({
        motor: Motor.fromName(selectedMotor, 1).toDict(),
        statorLimit: statorLimit.toDict(),
        supplyLimit: supplyLimit.toDict(),
        statorVoltage: statorVoltage.toDict(),
        supplyVoltage: supplyVoltage.toDict(),
      })
      .then((states) => {
        setWorkerWpilibSimStates(states);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [selectedMotor, statorLimit, supplyLimit, supplyVoltage, statorVoltage]);

  // The worker emits efficiency as a 0-1 ratio; scale it to a percentage so it
  // reads on its own 0-100% axis instead of being squashed against torque.
  const chartData = useMemo(
    () =>
      workerWpilibSimStates.map((s) => ({
        ...s,
        efficiencyPercent: s.efficiency * 100,
      })),
    [workerWpilibSimStates],
  );

  return (
    <div>
      <CalcHeading
        title="Motor Calculator"
        getSerializedState={() => serializedState}
      />

      <div className="flex flex-row flex-wrap gap-6 px-1">
        <div className="flex min-w-75 flex-1 flex-col">
          <section className="flex flex-col rounded-lg border">
            {/* Motor section */}
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Motor
              </h2>
              <IOLine>
                <MotorNameSelect
                  stateHook={[selectedMotor, setSelectedMotor]}
                  label="Motor"
                  testId="motor"
                  labelAbove
                />
              </IOLine>
            </div>
            <div className="border-t" />

            {/* Current Limits section */}
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Current Limits
              </h2>
              <IOLine>
                <MeasurementInput
                  stateHook={[statorLimit, setStatorLimit]}
                  label="Stator Limit"
                  testId="statorLimit"
                  labelAbove
                />
                <MeasurementInput
                  stateHook={[supplyLimit, setSupplyLimit]}
                  label="Supply Limit"
                  testId="supplyLimit"
                  labelAbove
                />
              </IOLine>
            </div>
            <div className="border-t" />

            {/* Voltage section */}
            <div className="flex flex-col gap-3 p-4">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Voltage
              </h2>
              <IOLine>
                <MeasurementInput
                  stateHook={[statorVoltage, setStatorVoltage]}
                  label="Stator Voltage"
                  testId="statorVoltage"
                  labelAbove
                />
                <MeasurementInput
                  stateHook={[supplyVoltage, setSupplyVoltage]}
                  label="Supply Voltage"
                  testId="supplyVoltage"
                  labelAbove
                />
              </IOLine>
            </div>
          </section>
        </div>

        <div className="flex min-w-75 flex-2 flex-col">
          <ChartContainer
            config={CHART_CONFIG}
            className="aspect-auto h-105 w-full"
          >
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 30, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="angularVelocityRPM"
                type="number"
                domain={[0, 'dataMax']}
                tickFormatter={(v: number) => v.toFixed(0)}
                label={{
                  value: 'Angular Velocity (RPM)',
                  position: 'insideBottom',
                  offset: -15,
                }}
              />
              <YAxis
                yAxisId="current"
                label={{
                  value: 'Current (A)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 15,
                  style: { textAnchor: 'middle' },
                }}
              />
              <YAxis
                yAxisId="torque"
                orientation="right"
                label={{
                  value: 'Torque (N·m)',
                  angle: 90,
                  position: 'insideRight',
                  offset: 15,
                  style: { textAnchor: 'middle' },
                }}
              />
              <YAxis
                yAxisId="efficiency"
                orientation="right"
                domain={[0, 100]}
                width={40}
                tickFormatter={(v: number) => `${v}%`}
                label={{
                  value: 'Efficiency (%)',
                  angle: 90,
                  position: 'insideRight',
                  offset: 15,
                  style: { textAnchor: 'middle' },
                }}
              />
              <Tooltip
                labelFormatter={(label) =>
                  typeof label === 'number' && Number.isFinite(label)
                    ? `${label.toFixed(0)} RPM`
                    : ''
                }
                formatter={(value) =>
                  typeof value === 'number' && Number.isFinite(value)
                    ? value.toFixed(2)
                    : String(value)
                }
              />
              <Legend
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: 20 }}
              />
              <Line
                name="Current (A)"
                dataKey="currentDrawAmps"
                yAxisId="current"
                dot={false}
                stroke="var(--color-currentDrawAmps)"
              />
              <Line
                name="Torque (N·m)"
                dataKey="torqueNewtonMeters"
                yAxisId="torque"
                dot={false}
                stroke="var(--color-torqueNewtonMeters)"
              />
              <Line
                name="Efficiency (%)"
                dataKey="efficiencyPercent"
                yAxisId="efficiency"
                dot={false}
                stroke="var(--color-efficiencyPercent)"
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      <div className="my-6 border-t" />

      <MotorTable />
    </div>
  );
}
