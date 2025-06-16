import { Divider, Message } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import React from "react";
import FeedforwardAnalysis from "./FeedforwardAnalysis";
import PositionFeedbackAnalysis from "./PositionFeedbackAnalysis";

interface PositionControlGainsAnalysisProps {
  kv: Measurement;
  ka: Measurement;
  kg?: Measurement;
  dt?: Measurement;
  posTolerance?: Measurement;
  velTolerance?: Measurement;
  distanceType: "linear" | "angular";
}

const PositionControlGainsAnalysis: React.FC<
  PositionControlGainsAnalysisProps
> = ({ kv, ka, kg, dt, posTolerance, velTolerance, distanceType }) => {
  return (
    <div>
      <Divider color="primary">Estimated Control Gains</Divider>
      <Message color="warning">
        Gains are approximations only, and are only as accurate as your
        configuration parameters - remember, "garbage in, garbage out." Pay
        particular attention to units. Always be careful the first time you
        enable closed-loop control of a mechanism.
      </Message>
      <FeedforwardAnalysis
        kV={kv}
        kA={ka}
        kG={kg}
        distanceType={distanceType}
      />
      <PositionFeedbackAnalysis
        kv={kv}
        ka={ka}
        dt={dt}
        posTolerance={posTolerance}
        velTolerance={velTolerance}
        distanceType={distanceType}
      />
    </div>
  );
};

export default PositionControlGainsAnalysis;
