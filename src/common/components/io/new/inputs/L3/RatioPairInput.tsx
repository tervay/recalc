import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { NumberInput } from "common/components/io/new/inputs";
import { Column, Columns } from "common/components/styling/Building";
import { StateHook } from "common/models/ExtraTypes";
import RatioPairList, { RatioPair } from "common/models/RatioPair";
import { useEffect, useState } from "react";

export default function RatioPairInput(props: {
  label: string;
  ratioPair: RatioPair;
  stateHook: StateHook<RatioPairList>;
}): JSX.Element {
  const [rpl, setRpl] = props.stateHook;
  const [pair, setPair] = useState(props.ratioPair);
  const [driving, setDriving] = useState(pair[0]);
  const [driven, setDriven] = useState(pair[1]);

  useEffect(() => {
    const old = pair;
    const new_: RatioPair = [driving, driven];
    setPair(new_);
    setRpl(rpl.replaceInSameSpot(old, new_));
  }, [driving, driven]);

  return (
    <>
      <Columns>
        <Column>{props.label}</Column>
        <Column>
          <SingleInputLine label="">
            <NumberInput stateHook={[driving, setDriving]} />
          </SingleInputLine>
        </Column>
        <Column>
          <SingleInputLine label="">
            <NumberInput stateHook={[driven, setDriven]} />
          </SingleInputLine>
        </Column>
      </Columns>
    </>
  );
}
