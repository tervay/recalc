import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import RatioPairInput from "common/components/io/new/inputs/L3/RatioPairInput";
import NumericOutput from "common/components/io/outputs/NumberOutput";
import { Button, Column, Columns } from "common/components/styling/Building";
import RatioPairList from "common/models/RatioPair";
import { useGettersSetters } from "common/tooling/conversion";
import { useEffect, useState } from "react";
import ratioConfig, {
  RatioParamsV1,
  RatioStateV1,
} from "web/calculators/ratio";
import { RatioPairState } from "web/calculators/ratio/converter";

export default function IntakeCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(
    RatioPairState.getState() as RatioStateV1
  );

  const [netRatio, setNetRatio] = useState(
    get.ratioPairs.calculateNetRatio().asNumber()
  );
  const [invNetRatio, setInvNetRatio] = useState(
    netRatio === 0.0 ? 0.0 : 1.0 / netRatio
  );

  useEffect(() => {
    setNetRatio(get.ratioPairs.calculateNetRatio().asNumber());
  }, [get.ratioPairs]);

  useEffect(() => {
    setInvNetRatio(netRatio === 0.0 ? 0.0 : 1.0 / netRatio);
  }, [netRatio]);

  return (
    <>
      <SimpleHeading
        queryParams={RatioParamsV1}
        state={get}
        title={ratioConfig.title}
      />

      <Columns desktop centered>
        <Column>
          <Columns>
            <Column>
              <b>Stage</b>
            </Column>
            <Column>
              <b>Driving</b>
            </Column>
            <Column>
              <b>Driven</b>
            </Column>
          </Columns>
          {get.ratioPairs.pairs.map((rp, i) => (
            <>
              <RatioPairInput
                label={`Stage ${i}`}
                ratioPair={rp}
                stateHook={[get.ratioPairs, set.setRatioPairs]}
              />
            </>
          ))}

          <Button
            color="primary"
            onClick={() => {
              set.setRatioPairs(
                new RatioPairList([...get.ratioPairs.pairs, [1, 1]])
              );
            }}
          >
            Add Stage
          </Button>
        </Column>

        <Column>
          <Columns>
            <Column>
              <SingleInputLine label="Net Reduction">
                <NumericOutput
                  stateHook={[netRatio, setNetRatio]}
                  roundTo={4}
                />
              </SingleInputLine>
            </Column>

            <Column>
              <SingleInputLine label="Net Step-Up">
                <NumericOutput
                  stateHook={[invNetRatio, setInvNetRatio]}
                  roundTo={4}
                />
              </SingleInputLine>
            </Column>
          </Columns>
        </Column>
      </Columns>
    </>
  );
}
