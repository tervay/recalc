import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import {
  BooleanInput,
  MeasurementInput,
  NumberInput,
} from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import {
  Button,
  Column,
  Columns,
  Panel,
} from "common/components/styling/Building";
import { StateHook } from "common/models/ExtraTypes";
import Piston from "common/models/Piston";
import PistonList from "common/models/PistonList";
import { useEffect, useState } from "react";
import LowKeyStringInput from "./base/LowKeyStringInput";

export default function PistonInput(props: {
  piston: Piston;
  name: string;
  removeFn: () => void;
  stateHook: StateHook<PistonList>;
}): JSX.Element {
  const [pl, setPl] = props.stateHook;
  const calculate = {
    extendForce: (p: Piston) => p.getExtendForce(extendPressure),
    retractForce: (p: Piston) => p.getRetractForce(retractPressure),
  };

  const [piston, setPiston] = useState(props.piston);

  const [name, setName] = useState(props.piston.identifier);
  const [quantity, setQuantity] = useState(props.piston.quantity);
  const [bore, setBore] = useState(props.piston.bore);
  const [rodDiameter, setRodDiameter] = useState(props.piston.rodDiameter);
  const [strokeLength, setStrokeLength] = useState(props.piston.strokeLength);
  const [retractPressure, setRetractPressure] = useState(
    props.piston.retractPressure
  );
  const [extendPressure, setExtendPressure] = useState(
    props.piston.extendPressure
  );
  const [enabled, setEnabled] = useState(props.piston.enabled);
  const [period, setPeriod] = useState(props.piston.period);

  const [retractForce, setRetractForce] = useState(
    calculate.retractForce(piston).to("N")
  );
  const [extendForce, setExtendForce] = useState(
    calculate.extendForce(piston).to("N")
  );

  useEffect(() => {
    const oldPiston = piston;
    const newPiston = new Piston(
      name,
      quantity,
      bore,
      rodDiameter,
      strokeLength,
      retractPressure,
      extendPressure,
      enabled,
      period
    );
    setPiston(newPiston);
    setPl(pl.replaceInSameSpot(oldPiston, newPiston));
  }, [
    name,
    quantity,
    rodDiameter,
    strokeLength,
    retractPressure,
    extendPressure,
    enabled,
    period,
  ]);

  useEffect(() => {
    setRodDiameter(Piston.rodDiameterFromBore(bore));
  }, [bore]);

  useEffect(() => {
    setExtendForce(calculate.extendForce(piston));
  }, [piston, extendPressure]);

  useEffect(() => {
    setRetractForce(calculate.retractForce(piston));
  }, [piston, retractPressure]);

  return (
    <Panel
      removeInternalBorders
      heading={
        <Columns multiline vcentered marginLess paddingLess gapless>
          <Column ofTwelve={8}>
            <LowKeyStringInput
              stateHook={[name, setName]}
              disabled={!piston.enabled}
            />
          </Column>
          <Column>
            <Button
              color="primary"
              faIcon="minus-circle"
              inverted={enabled}
              onClick={props.removeFn}
            >
              Remove
            </Button>
          </Column>
        </Columns>
      }
      color={enabled ? "primary" : undefined}
    >
      <Columns multiline>
        <Column>
          <SingleInputLine label="Enabled" key={`${piston.identifier}-enable`}>
            <BooleanInput stateHook={[enabled, setEnabled]} />
          </SingleInputLine>
        </Column>
        <Column>
          <SingleInputLine
            label="Count"
            tooltip="Number of identical cylinders on the robot."
          >
            <NumberInput stateHook={[quantity, setQuantity]} />
          </SingleInputLine>
        </Column>
      </Columns>
      <SingleInputLine
        label="Bore"
        key={`${piston.identifier}-bore`}
        wrap
        tooltip="Outer diameter of the cylinder itself."
      >
        <MeasurementInput stateHook={[bore, setBore]} />
      </SingleInputLine>
      <SingleInputLine
        wrap
        label="Rod Diameter"
        key={`${piston.identifier}-rodDiameter`}
        tooltip="Diameter of the piston rod that extends out of the cylinder. Typically based on bore."
      >
        <MeasurementOutput
          stateHook={[rodDiameter, setRodDiameter]}
          numberRoundTo={
            [0.1875, 0.3125, 0.4375].includes(rodDiameter.to("in").scalar)
              ? 4
              : 3
          }
        />
      </SingleInputLine>
      <SingleInputLine
        wrap
        label="Stroke Length"
        key={`${piston.identifier}-stroke`}
        tooltip="Length that the piston rod extends out of the cylinder."
      >
        <MeasurementInput stateHook={[strokeLength, setStrokeLength]} />
      </SingleInputLine>
      <SingleInputLine
        wrap
        label="Retract Pressure"
        key={`${piston.identifier}-retractPressure`}
        tooltip="Maximum working pressure for the retraction of the cylinder."
      >
        <MeasurementInput stateHook={[retractPressure, setRetractPressure]} />
      </SingleInputLine>
      <SingleInputLine
        wrap
        label="Extend Pressure"
        key={`${piston.identifier}-extendPressure`}
        tooltip="Maximum working pressure for the extension of the cylinder."
      >
        <MeasurementInput
          expanded={true}
          stateHook={[extendPressure, setExtendPressure]}
        />
      </SingleInputLine>
      <SingleInputLine
        wrap
        label="Retract Force"
        key={`${piston.identifier}-retractForce`}
        tooltip="Resulting force the cylinder can retract at."
      >
        <MeasurementOutput
          expanded={true}
          stateHook={[retractForce, setRetractForce]}
          numberRoundTo={2}
        />
      </SingleInputLine>
      <SingleInputLine
        wrap
        label="Extend Force"
        key={`${piston.identifier}-extendForce`}
        tooltip="Resulting force the cylinder can extend at."
      >
        <MeasurementOutput
          expanded={true}
          stateHook={[extendForce, setExtendForce]}
          numberRoundTo={2}
          defaultUnit="N"
        />
      </SingleInputLine>
      <SingleInputLine
        label="Toggle State Every"
        key={`${piston.identifier}-period`}
        tooltip="How often this set of cylinders fires in a match."
        wrap
      >
        <MeasurementInput stateHook={[period, setPeriod]} />
      </SingleInputLine>
    </Panel>
  );
}
