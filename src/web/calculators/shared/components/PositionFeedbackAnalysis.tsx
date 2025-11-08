import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import MeasurementInput from "common/components/io/new/inputs/L3/MeasurementInput";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Divider, Message } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import { identity, Matrix, matrix, multiply } from "mathjs";
import React, { useEffect, useState } from "react";
import { discretize_ab } from "../discretize";
import { latencyCompensatePosition, lqr } from "../lqr";
import CostFunctionControls from "./CostFunctionControls";

interface PositionFeedbackAnalysisProps {
  kv: Measurement;
  ka: Measurement;
  dt?: Measurement;
  distanceType: "linear" | "angular";
}

const batteryVoltage = new Measurement(12, "V");

const PositionFeedbackAnalysis: React.FC<PositionFeedbackAnalysisProps> = ({
  kv,
  ka,
  distanceType,
}) => {
  const distanceUnit = distanceType === "angular" ? "rotation" : "m";
  const velocityUnit = distanceType === "angular" ? "rotation/s" : "m/s";
  const kPUnit = distanceType === "angular" ? "V/rotation" : "V/m";
  const kVUnit = distanceType === "angular" ? "V*s/rotation" : "V*s/m";
  const kAUnit = distanceType === "angular" ? "V*s^2/rotation" : "V*s^2/m";
  const [maxEffort, setMaxEffort] = useState<Measurement>(
    batteryVoltage.div(3),
  );
  const [dt, setDt] = useState<Measurement>(new Measurement(0, "s"));
  const [measurementDelay, setMeasurementDelay] = useState(
    new Measurement(0, "s"),
  );

  const defaultVelTolerance = React.useMemo(() => {
    try {
      const dtTolerance = Measurement.max(ka.div(kv), measurementDelay);
      return batteryVoltage.div(ka).mul(dtTolerance).mul(0.1);
    } catch (e) {
      return new Measurement(
        0,
        distanceType === "angular" ? "rotation/s" : "m/s",
      );
    }
  }, [ka, kv, distanceType, measurementDelay]);

  const [velTolerance, setVelTolerance] =
    useState<Measurement>(defaultVelTolerance);

  const defaultPosTolerance = React.useMemo(() => {
    try {
      const dtTolerance = Measurement.max(ka.div(kv), measurementDelay);
      return batteryVoltage.mul(dtTolerance).mul(dtTolerance).div(ka);
    } catch (e) {
      return new Measurement(0, distanceType === "angular" ? "rotation" : "m");
    }
  }, [ka, kv, distanceType, measurementDelay]);

  const [posTolerance, setPosTolerance] =
    useState<Measurement>(defaultPosTolerance);

  useEffect(() => {
    setPosTolerance(defaultPosTolerance);
  }, [defaultPosTolerance]);

  useEffect(() => {
    setVelTolerance(defaultVelTolerance);
  }, [defaultVelTolerance]);

  const gains = React.useMemo(() => {
    const dt_s = dt.to("s").scalar;
    const measurementDelay_s = measurementDelay.to("s").scalar;
    const posTolerance_m = posTolerance.to(distanceUnit).scalar;
    const velTolerance_si = velTolerance.to(velocityUnit).scalar;
    const maxEffort_v = maxEffort.to("V").scalar;
    if (
      posTolerance_m === 0 ||
      velTolerance_si === 0 ||
      maxEffort_v === 0 ||
      measurementDelay_s === 0 ||
      dt_s === 0
    ) {
      return {
        kp: new Measurement(0, kPUnit),
        kd: new Measurement(0, kVUnit),
      };
    }

    const A_cont = matrix([
      [0, 1],
      [0, -kv.to(kVUnit).scalar / ka.to(kAUnit).scalar],
    ]);

    const B_cont = matrix([[0], [1 / ka.to(kAUnit).scalar]]);

    const [A_disc, B_disc] = discretize_ab(A_cont, B_cont, dt_s);

    const Q = matrix([
      [1 / posTolerance_m ** 2, 0],
      [0, 1 / velTolerance_si ** 2],
    ]);

    const R = multiply(identity(2) as Matrix, 1 / maxEffort_v ** 2);

    let gains = lqr(A_disc, B_disc, Q, R);

    gains = latencyCompensatePosition(
      gains.kp,
      gains.kd,
      A_disc,
      B_disc,
      dt_s,
      measurementDelay_s,
    );

    return {
      kp: new Measurement(gains.kp, kPUnit),
      kd: new Measurement(gains.kd, kVUnit),
    };
  }, [dt, measurementDelay, posTolerance, velTolerance, maxEffort, kv, ka]);

  return (
    <div>
      <Divider color="primary">Feedback Gains (position)</Divider>
      <Message color="warning">
        Stability and optimality of these feedback gains depend critically on
        *both* the loop time and measurement delay inputs; gains will not be
        computed until you provide nonzero values for both. Do *not* blindly
        guess values - at that point, you are better off tuning manually.
      </Message>
      <CostFunctionControls
        maxEffort={maxEffort}
        setMaxEffort={setMaxEffort}
        posTolerance={posTolerance}
        setPosTolerance={setPosTolerance}
        velTolerance={velTolerance}
        setVelTolerance={setVelTolerance}
        distanceUnit={distanceUnit}
        velocityUnit={velocityUnit}
        toleranceType="position"
      />
      <SingleInputLine
        label="Loop Time (dt)"
        id="dt"
        tooltip="The amount of time between each control loop iteration.  Lower values allow more aggressive control gains."
      >
        <MeasurementInput
          stateHook={[dt, setDt]}
          defaultUnit="ms"
          step={1}
          style={dt.scalar === 0 ? { border: "2px solid red" } : {}}
        />
      </SingleInputLine>
      <SingleInputLine
        label="Measurement Delay"
        id="measurementDelay"
        tooltip="The time it takes to acquire a measurement. Optimal feedback gains shrink exponentially as the
        measurement delay exceeds the system response time (see above).  Measurement delay can result from velocity
        measurement filtering, CAN packet delays, and loop timing."
      >
        <MeasurementInput
          stateHook={[measurementDelay, setMeasurementDelay]}
          defaultUnit="ms"
          step={1}
          style={
            measurementDelay.scalar === 0 ? { border: "2px solid red" } : {}
          }
        />
      </SingleInputLine>
      <SingleInputLine
        label="kP"
        id="kp"
        tooltip="Proportional feedback gain.  The amount of voltage to apply proportional to the position error."
      >
        <MeasurementOutput
          stateHook={[gains.kp, () => {}]}
          numberRoundTo={2}
          defaultUnit={kPUnit}
        />
      </SingleInputLine>
      <SingleInputLine
        label="kD"
        id="kd"
        tooltip="Derivative feedback gain.  The amount of voltage to apply proportional to the velocity error."
      >
        <MeasurementOutput
          stateHook={[gains.kd, () => {}]}
          numberRoundTo={2}
          defaultUnit={kVUnit}
        />
      </SingleInputLine>
    </div>
  );
};

export default PositionFeedbackAnalysis;
