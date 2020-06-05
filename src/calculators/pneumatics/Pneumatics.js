import React, { useState, useEffect } from "react";
import TabularInput from "common/components/io/inputs/TabularInput";
import Qty from "js-quantities";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";

export default function Pneumatics() {
  const p1_ = {
    diameter: Qty(1.5, "in"),
    rodDiameter: Qty(3.75, "in"),
    strokeLength: Qty(12, "in"),
    pushPressure: Qty(15, "psi"),
    period: Qty(20, "s"),
  };

  const [p1, setP1] = useState(p1_);
  const [p2, setP2] = useState(p1_);
  const [p3, setP3] = useState(p1_);
  const [p4, setP4] = useState(p1_);
  const [p5, setP5] = useState(p1_);

  const [test, setTest] = useState(0);

  useEffect(() => {
    setTest(p1.period.to("s").scalar * p1.diameter.to("cm").scalar);
  }, [p1]);

  return (
    <>
      <TabularInput
        headers={[
          "",
          "Diameter",
          "Rod Diameter",
          "Stroke Length",
          "Push Pressure",
          "Actuation Period",
        ]}
        inputs={[
          [p1, setP1],
          [p2, setP2],
          [p3, setP3],
          [p4, setP4],
          [p5, setP5],
        ]}
        labels={["P1", "P2", "P3", "P4", "P5"]}
      />
      <LabeledNumberOutput label="test" stateHook={[test, setTest]} />
    </>
  );
}
