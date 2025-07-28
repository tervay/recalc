interface AugmentedMeasurementInputProps extends MeasurementInputProps {
  id?: string;
  disabledIf?: () => boolean;
  primaryIf?: () => boolean;
  size?: InputSize;
  rounded?: boolean;
  expanded?: boolean;
  linkIf?: () => boolean;
  successIf?: () => boolean;
  warningIf?: () => boolean;
  infoIf?: () => boolean;
  dangerIf?: () => boolean;
  roundTo?: number;
}

type InputSize = "small" | "normal" | "medium" | "large";

import {
  getColorableClass,
  getRoundClass,
  getSizeClass,
} from "common/components/io/classes";
import Control from "common/components/io/new/inputs/Control";
import { MeasurementInputProps } from "common/components/io/new/inputs/types/Types";
import Measurement from "common/models/Measurement";
import { useEffect, useState } from "react";

export default function MeasurementInputOutput(
  props: AugmentedMeasurementInputProps,
): JSX.Element {
  const [meas, setMeas] = props.stateHook;
  const [numberValue, setNumberValue] = useState(
    meas.scalar.toFixed(props.roundTo ?? 2),
  );
  const [unitValue, setUnitValue] = useState(props.defaultUnit ?? meas.units());

  useEffect(() => {
    setNumberValue(meas.to(unitValue).scalar.toString());
  }, [meas.scalar, props.defaultUnit, props.roundTo]);

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    setNumberValue(newValue.toString());
    setMeas((prevMeas) => new Measurement(newValue, unitValue));
  };

  const handleUnitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = event.target.value;
    setUnitValue(newUnit);
    setMeas((prevMeas) => prevMeas.to(newUnit));
  };

  const classes = [
    "input",
    "input-right",
    getColorableClass({
      ...props,
      primaryIf: props.primaryIf ?? (() => false),
      linkIf: props.linkIf ?? (() => false),
      successIf: props.successIf ?? (() => false),
      warningIf: props.warningIf ?? (() => false),
      infoIf: props.infoIf ?? (() => false),
      dangerIf: props.dangerIf ?? (() => false),
    }),
    getSizeClass({ ...props, size: props.size ?? "normal" }),
    getRoundClass({ ...props, rounded: props.rounded ?? false }),
  ].join(" ");

  return (
    <Control skipControl={true} expanded={props.expanded ?? false}>
      <div className="field has-addons">
        <input
          type="number"
          className={classes}
          value={numberValue}
          onChange={handleNumberChange}
          id={props.id}
          data-testid={props.id}
          disabled={props.disabledIf?.()}
          step={props.step}
        />
        <div className="select is-fullwidth">
          <select value={unitValue} onChange={handleUnitChange}>
            {Measurement.choices(meas).map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Control>
  );
}
