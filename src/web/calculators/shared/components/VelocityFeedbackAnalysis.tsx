import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Divider } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import { matrix } from "mathjs";
import React, { useState } from "react";
import { discretize_ab } from "../discretize";
import { latencyCompensateVelocity, lqr } from "../lqr";

import MeasurementInput from "common/components/io/new/inputs/L3/MeasurementInput";
import CostFunctionControls from "./CostFunctionControls";

interface VelocityFeedbackAnalysisProps {
  kv: Measurement;
  ka: Measurement;
  dt?: Measurement;
  velTolerance?: Measurement;
}

const VelocityFeedbackAnalysis: React.FC<VelocityFeedbackAnalysisProps> = ({
  kv,
  ka,
  dt: _dt,
  velTolerance: _velTolerance,
}) => {
  const [maxEffort, setMaxEffort] = useState<Measurement>(
    new Measurement(12, "V"),
  );
  const [dt, setDt] = useState<Measurement>(_dt ?? new Measurement(0.001, "s"));
  const [measurementDelay, setMeasurementDelay] = useState(
    new Measurement(0, "s"),
  );

  const defaultVelTolerance = React.useMemo(() => {
    try {
      return maxEffort.div(kv);
    } catch (e) {
      return new Measurement(0, "m/s");
    }
  }, [maxEffort, kv]);

  const [velTolerance, setVelTolerance] = useState<Measurement>(
    _velTolerance ?? defaultVelTolerance,
  );

  const gains = React.useMemo(() => {
    const dt_s = dt.to("s").scalar;
    const measurementDelay_s = measurementDelay.to("s").scalar;
    const velTolerance_si = velTolerance.to("m/s").scalar;
    const maxEffort_v = maxEffort.to("V").scalar;

    if (velTolerance_si === 0 || maxEffort_v === 0) {
      return {
        kp: new Measurement(0, "V*s/m"),
      };
    }

    const A_cont = matrix([[-kv.to("V*s/m").scalar / ka.to("V*s^2/m").scalar]]);

    const B_cont = matrix([[1 / ka.to("V*s^2/m").scalar]]);

    const [A_disc, B_disc] = discretize_ab(A_cont, B_cont, dt_s);

    const Q = matrix([[1 / velTolerance_si ** 2]]);

    const R = matrix([[1 / maxEffort_v ** 2]]);

    let gains: { kp: number } = lqr(
      // @ts-expect-error mathjs types inconsistent here
      matrix([[A_disc]]),
      // @ts-expect-error mathjs types inconsistent here
      matrix([[B_disc]]),
      Q,
      R,
    );
    if (measurementDelay_s > 0) {
      gains = latencyCompensateVelocity(
        gains.kp,
        A_disc,
        B_disc,
        dt_s,
        measurementDelay_s,
      );
    }
    return {
      kp: new Measurement(gains.kp, "V*s/m"),
    };
  }, [dt, measurementDelay, velTolerance, maxEffort, kv, ka]);

  return (
    <div>
      <Divider color="primary">Feedback Gains (velocity)</Divider>
      <CostFunctionControls
        maxEffort={maxEffort}
        setMaxEffort={setMaxEffort}
        velTolerance={velTolerance}
        setVelTolerance={setVelTolerance}
        velocityUnit="m/s"
        toleranceType="velocity"
      />
      <SingleInputLine
        label="Loop Time (dt)"
        id="dt"
        tooltip="The amount of time between each control loop iteration.  Lower values allow more aggressive control gains."
      >
        <MeasurementInput
          stateHook={[dt, setDt]}
          defaultUnit="s"
          step={0.001}
        />
      </SingleInputLine>
      <SingleInputLine
        label="Measurement Delay"
        id="measurementDelay"
        tooltip="The time it takes to acquire a velocity measurement. Optimal feedback gains shrink exponentially as the measurement delay exceeds the system response time (see above).  The biggest source of velocity measurement delay is typically filtering of the encoder signal."
      >
        <MeasurementInput
          stateHook={[measurementDelay, setMeasurementDelay]}
          defaultUnit="s"
          step={0.1}
        />
      </SingleInputLine>
      <SingleInputLine
        label="kP"
        id="kp"
        tooltip="Proportional feedback gain.  The amount of voltage to apply proportional to the velocity error."
      >
        <MeasurementOutput stateHook={[gains.kp, () => {}]} numberRoundTo={2} />
      </SingleInputLine>
    </div>
  );
};

export default VelocityFeedbackAnalysis;
