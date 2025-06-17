import { Divider, Message } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import React from "react";
import FeedforwardAnalysis from "./FeedforwardAnalysis";
import VelocityFeedbackAnalysis from "./VelocityFeedbackAnalysis";

interface VelocityControlGainsAnalysisProps {
  kv: Measurement;
  ka: Measurement;
  dt?: Measurement;
  velTolerance?: Measurement;
}

const VelocityControlGainsAnalysis: React.FC<
  VelocityControlGainsAnalysisProps
> = ({ kv, ka, dt, velTolerance }) => {
  return (
    <div>
      <Divider color="primary">Estimated Control Gains</Divider>
      <Message color="warning">
        Gains are approximations only, and are only as accurate as your
        configuration parameters - remember, "garbage in, garbage out." Pay
        particular attention to units. Always be careful the first time you
        enable closed-loop control of a mechanism.
      </Message>
      <FeedforwardAnalysis kV={kv} kA={ka} distanceType={"linear"} />
      <VelocityFeedbackAnalysis
        kv={kv}
        ka={ka}
        dt={dt}
        velTolerance={velTolerance}
      />
    </div>
  );
};

export default VelocityControlGainsAnalysis;
