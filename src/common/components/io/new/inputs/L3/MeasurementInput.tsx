import L2NumberSelect from "common/components/io/new/inputs/L2/L2NumberSelect";
import { MeasurementInputProps } from "common/components/io/new/inputs/types/Types";
import Measurement from "common/models/Measurement";
import { useEffect, useState } from "react";

export default function MeasurementInput(
  props: MeasurementInputProps,
): JSX.Element {
  const [meas, setMeas] = props.stateHook;
  const [newMeas, setNewMeas] = useState(
    meas.to(props.defaultUnit ?? meas.units()),
  );

  useEffect(() => {
    if (props.numberDisabledIf?.()) {
      setNewMeas(meas.to(newMeas.units()));
    }
  }, [meas]);

  useEffect(() => {
    if (!props.numberDisabledIf?.()) {
      setMeas(newMeas);
    }
  }, [newMeas]);

  return (
    <L2NumberSelect
      {...(({ stateHook: _, ...o }) => o)(props)}
      stateHook={[newMeas, setNewMeas]}
      fromNumber={(n) => {
        return new Measurement(n, Measurement.clarifyUnit(meas.units()));
      }}
      makeNumber={(m) => m.scalar}
      fromString={(s) => {
        if (props.numberDisabledIf?.()) {
          return meas.to(s);
        } else {
          return new Measurement(meas.scalar, s);
        }
      }}
      makeString={(m) => Measurement.clarifyUnit(m.units())}
      choices={Measurement.choices(meas)}
    />
  );
}
