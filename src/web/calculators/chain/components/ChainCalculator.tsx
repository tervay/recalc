import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { MeasurementInput, NumberInput } from "common/components/io/new/inputs";
import ChainInput from "common/components/io/new/inputs/L3/ChainInput";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import NumericOutput from "common/components/io/outputs/NumberOutput";
import { Column, Columns, Divider } from "common/components/styling/Building";
import Chain, { chainPitchMap } from "common/models/Chain";
import Sprocket from "common/models/Sprocket";
import { useGettersSetters } from "common/tooling/conversion";
import { useEffect, useState } from "react";
import chainConfig, {
  ChainParamsV1,
  ChainStateV1,
} from "web/calculators/chain";
import SprocketCheatSheet from "web/calculators/chain/components/SprocketCheatSheet";
import { ChainState } from "web/calculators/chain/converter";
import {
  ChainClosestCentersResult,
  calculateCenters,
} from "web/calculators/chain/math";

export default function ChainCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(ChainState.getState() as ChainStateV1);

  const calculate = {
    p1PD: () => new Sprocket(get.p1Teeth, get.chain.pitch).pitchDiameter,
    p2PD: () => new Sprocket(get.p2Teeth, get.chain.pitch).pitchDiameter,
    smallerCenter: (res: ChainClosestCentersResult) => res.smaller.distance,
    smallerLinks: (res: ChainClosestCentersResult) => res.smaller.links,
    largerCenter: (res: ChainClosestCentersResult) => res.larger.distance,
    largerLinks: (res: ChainClosestCentersResult) => res.larger.links,
  };

  const [p1PD, setP1PD] = useState(calculate.p1PD());
  const [p2PD, setP2PD] = useState(calculate.p2PD());

  const results = calculateCenters(
    get.chain,
    get.p1Teeth,
    get.p2Teeth,
    get.desiredCenter
  );

  const [smallerCenter, setSmallerCenter] = useState(
    calculate.smallerCenter(results)
  );
  const [smallerLinks, setSmallerLinks] = useState(
    calculate.smallerLinks(results)
  );
  const [largerCenter, setLargerCenter] = useState(
    calculate.largerCenter(results)
  );
  const [largerLinks, setLargerLinks] = useState(
    calculate.largerLinks(results)
  );

  useEffect(() => {
    const results = calculateCenters(
      get.chain,
      get.p1Teeth,
      get.p2Teeth,
      get.desiredCenter
    );

    setSmallerCenter(results.smaller.distance.add(get.extraCenter));
    setSmallerLinks(results.smaller.links);
    setLargerCenter(results.larger.distance.add(get.extraCenter));
    setLargerLinks(results.larger.links);
  }, [get.chain, get.p1Teeth, get.p2Teeth, get.desiredCenter, get.extraCenter]);

  useEffect(() => {
    setP1PD(calculate.p1PD());
  }, [get.p1Teeth, get.chain]);

  useEffect(() => {
    setP2PD(calculate.p2PD());
  }, [get.p2Teeth, get.chain]);

  let cheatSheet = (
    <SprocketCheatSheet chainType={new Chain("#40")} currentSprockets={[]} />
  );
  if (get.chain.eq(new Chain("#25"))) {
    cheatSheet = (
      <SprocketCheatSheet
        chainType={new Chain("#25")}
        currentSprockets={[
          new Sprocket(get.p1Teeth, get.chain.pitch),
          new Sprocket(get.p2Teeth, get.chain.pitch),
        ]}
      />
    );
  } else if (get.chain.eq(new Chain("#35"))) {
    cheatSheet = (
      <SprocketCheatSheet
        chainType={new Chain("#35")}
        currentSprockets={[
          new Sprocket(get.p1Teeth, get.chain.pitch),
          new Sprocket(get.p2Teeth, get.chain.pitch),
        ]}
      />
    );
  }

  return (
    <>
      <SimpleHeading
        queryParams={ChainParamsV1}
        state={get}
        title={chainConfig.title}
      />
      <Columns desktop centered>
        <Column>
          <SingleInputLine
            label="Chain Type"
            id="chain"
            tooltip={
              <>
                {Object.entries(chainPitchMap).map(([name, pitch]) => (
                  <>
                    <span>{`${name} has pitch ${pitch.format()}.`}</span>
                    <br />
                  </>
                ))}
                Bike chain is typically #40.
              </>
            }
          >
            <ChainInput stateHook={[get.chain, set.setChain]} />
          </SingleInputLine>
          <SingleInputLine
            label="Desired Center"
            id="desiredCenter"
            tooltip="Desired distance between the centers of each sprocket."
          >
            <MeasurementInput
              stateHook={[get.desiredCenter, set.setDesiredCenter]}
            />
          </SingleInputLine>
          <SingleInputLine
            label="Extra Center"
            id="extraCenter"
            tooltip="An extra distance applied after the C-C calculations to ensure snug chain fit."
          >
            <MeasurementInput
              stateHook={[get.extraCenter, set.setExtraCenter]}
              defaultUnit="mm"
            />
          </SingleInputLine>
          <Divider color="primary">Sprocket 1</Divider>
          <Columns formColumns>
            <Column>
              <SingleInputLine label="Teeth" id="p1Teeth" for="id">
                <NumberInput stateHook={[get.p1Teeth, set.setP1Teeth]} />
              </SingleInputLine>
            </Column>

            <Column>
              <SingleInputLine
                label="PD"
                id="p1PitchDiameter"
                tooltip="Pitch Diameter"
              >
                <MeasurementOutput
                  stateHook={[p1PD, setP1PD]}
                  numberRoundTo={4}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Divider color="primary">Sprocket 2</Divider>
          <Columns formColumns>
            <Column>
              <SingleInputLine label="Teeth" id="p2Teeth" for="id">
                <NumberInput stateHook={[get.p2Teeth, set.setP2Teeth]} />
              </SingleInputLine>
            </Column>

            <Column>
              <SingleInputLine
                label="PD"
                id="p2PitchDiameter"
                tooltip="Pitch Diameter"
              >
                <MeasurementOutput
                  stateHook={[p2PD, setP2PD]}
                  numberRoundTo={4}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Divider color="primary">Smaller Chain</Divider>
          <Columns formColumns multiline>
            <Column fullhdPercentage={0.4} percentage={1}>
              <SingleInputLine label="Chain Links" id="smallerLinks">
                <NumericOutput
                  stateHook={[smallerLinks, setSmallerLinks]}
                  roundTo={0}
                />
              </SingleInputLine>
            </Column>
            <Column fullhdPercentage={0.6} percentage={1}>
              <SingleInputLine label="Center Distance" id="smallerCenter">
                <MeasurementOutput
                  stateHook={[smallerCenter, setSmallerCenter]}
                  numberRoundTo={4}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
          </Columns>

          <Divider color="primary">Larger Chain</Divider>
          <Columns formColumns multiline>
            <Column fullhdPercentage={0.4} percentage={1}>
              <SingleInputLine label="Chain Links" id="largerLinks">
                <NumericOutput
                  stateHook={[largerLinks, setLargerLinks]}
                  roundTo={0}
                />
              </SingleInputLine>
            </Column>
            <Column fullhdPercentage={0.6} percentage={1}>
              <SingleInputLine label="Center Distance" id="largerCenter">
                <MeasurementOutput
                  stateHook={[largerCenter, setLargerCenter]}
                  numberRoundTo={4}
                  defaultUnit="in"
                />
              </SingleInputLine>
            </Column>
          </Columns>
        </Column>
        <Column>{cheatSheet}</Column>
      </Columns>
    </>
  );
}
