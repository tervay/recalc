import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { BooleanInput, NumberInput } from "common/components/io/new/inputs";
import { Column, Columns, Divider } from "common/components/styling/Building";
import { Gearbox2, MotionMethod } from "common/models/Gearbox";
import { useGettersSetters } from "common/tooling/conversion";
import { wrap } from "common/tooling/promise-worker";
import groupBy from "lodash/groupBy";
import { useEffect, useState } from "react";
import ratioFinderConfig, {
  RatioFinderParamsV1,
  RatioFinderStateV1,
} from "web/calculators/ratioFinder";
import { RatioFinderState } from "web/calculators/ratioFinder/converter";
import { RatioFinderWorkerFunctions } from "web/calculators/ratioFinder/math";
import rawWorker from "web/calculators/ratioFinder/math?worker";

const worker = await wrap<RatioFinderWorkerFunctions>(new rawWorker());

function MotionMethodCell(props: {
  motionMethods: MotionMethod[];
  excludePinions?: boolean;
}): JSX.Element {
  let mms = props.motionMethods;
  if (props.excludePinions === true) {
    mms = mms.filter((m) => !["Falcon", "NEO", "550", "775"].includes(m.bore));
  }

  let gb = groupBy(mms, (m) => m.bore);
  const keys = props.excludePinions
    ? Object.keys(gb).filter(
        (k) => !["Falcon", "NEO", "550", "775"].includes(k)
      )
    : Object.keys(gb);

  return (
    <>
      <table className="table is-fullwidth is-narrow p-0">
        <thead>
          <tr>
            <th>Bore</th>
            <th>P/N</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr>
              <td>{k}</td>
              <td>
                {gb[k].map((m) => (
                  <>
                    ({m.type.slice(0, 1)}) <a href={m.url}>{m.partNumber}</a>
                    <br />
                  </>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function GearboxRows(props: {
  gearbox: Gearbox2;
  maxStages: number;
}): JSX.Element {
  const emptyStages = props.maxStages - props.gearbox.getStages();

  return (
    <>
      <tr>
        <td rowSpan={2} className="thick-bottom-border">
          {props.gearbox.getRatio().toFixed(2).replace(/\.00$/, "")}:1
        </td>
        {props.gearbox.stages.map((stage) => (
          <td colSpan={2} className="has-text-centered">
            <b>
              {stage.driving}:{stage.driven}
            </b>
          </td>
        ))}
        {emptyStages > 0 &&
          [...Array(emptyStages)].map((_) => <td colSpan={2}></td>)}
      </tr>

      <tr>
        {props.gearbox.stages.map((stage, i) => (
          <>
            <td
              colSpan={1}
              className="has-text-centered unset-va thick-bottom-border p-0"
            >
              <MotionMethodCell
                motionMethods={stage.drivingMethods}
                excludePinions={i > 0}
              />
            </td>
            <td
              colSpan={1}
              className="has-text-centered unset-va thick-bottom-border p-0"
            >
              <MotionMethodCell
                motionMethods={stage.drivenMethods}
                excludePinions
              />
            </td>
          </>
        ))}
      </tr>
    </>
  );
}

export default function RatioFinderCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(
    RatioFinderState.getState() as RatioFinderStateV1
  );

  const [gearboxes, setGearboxes] = useState([] as Gearbox2[]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    worker.generateOptions(get).then((r) => {
      setGearboxes(r.map((obj) => Gearbox2.fromObj(obj)));
      setIsLoading(false);
    });
  }, [
    get.targetReduction,
    get.minReduction,
    get.maxReduction,
    get.minStages,
    get.maxStages,
    get.firstPartPinion,
    get.enableVPs,
    get.enableMPs,
    get.enableSports,
    get.enableGT2,
    get.enableHTD,
    get.enableRT25,
    get.minPulleyTeeth,
    get.maxPulleyTeeth,
    get.enable25Chain,
    get.enable35Chain,
    get.minSprocketTeeth,
    get.maxSprocketTeeth,
    get.enable20DPGears,
    get.enable32DPGears,
    get.minGearTeeth,
    get.maxGearTeeth,
    get.enableNEOPinions,
    get.enableFalconPinions,
    get.enable775Pinions,
    get.enable550Pinions,
    get.enableVEX,
    get.enableREV,
    get.enableWCP,
    get.enableAM,
    get.enableTTB,
  ]);

  const [displayNum, setDisplayNum] = useState(20);

  return (
    <>
      <SimpleHeading
        queryParams={RatioFinderParamsV1}
        state={get}
        title={ratioFinderConfig.title}
      />
      <>
        <Divider>Ratio Settings</Divider>
        <Columns>
          <Column>
            <SingleInputLine label="Target Reduction">
              <NumberInput
                stateHook={[get.targetReduction, set.setTargetReduction]}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Min Reduction">
              <NumberInput
                stateHook={[get.minReduction, set.setMinReduction]}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Max Reduction">
              <NumberInput
                stateHook={[get.maxReduction, set.setMaxReduction]}
              />
            </SingleInputLine>
          </Column>
        </Columns>
        <Columns>
          {/* <Column narrow>
            <SingleInputLine label="COTS Only">
              <BooleanInput stateHook={[get.cotsOnly, set.setCotsOnly]} />
            </SingleInputLine>
          </Column> */}
          <Column narrow>
            <SingleInputLine label="First Part Pinion">
              <BooleanInput
                stateHook={[get.firstPartPinion, set.setFirstPartPinion]}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Min Stages">
              <NumberInput stateHook={[get.minStages, set.setMinStages]} />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Max Stages">
              <NumberInput stateHook={[get.maxStages, set.setMaxStages]} />
            </SingleInputLine>
          </Column>
        </Columns>
        <Divider>Vendor Settings</Divider>
        <Columns>
          <Column narrow>
            <SingleInputLine label="Enable REV">
              <BooleanInput stateHook={[get.enableREV, set.setEnableREV]} />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable VEX">
              <BooleanInput stateHook={[get.enableVEX, set.setEnableVEX]} />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable WCP">
              <BooleanInput stateHook={[get.enableWCP, set.setEnableWCP]} />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable AM">
              <BooleanInput stateHook={[get.enableAM, set.setEnableAM]} />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable TTB">
              <BooleanInput stateHook={[get.enableTTB, set.setEnableTTB]} />
            </SingleInputLine>
          </Column>
        </Columns>
        <Divider>Planetary Settings</Divider>
        <Columns>
          <Column narrow>
            <SingleInputLine label="Enable VPs">
              <BooleanInput stateHook={[get.enableVPs, set.setEnableVPs]} />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable MPs">
              <BooleanInput stateHook={[get.enableMPs, set.setEnableMPs]} />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable Sports">
              <BooleanInput
                stateHook={[get.enableSports, set.setEnableSports]}
              />
            </SingleInputLine>
          </Column>
        </Columns>
        <Divider>Pulley Settings</Divider>
        <Columns>
          <Column narrow>
            <SingleInputLine label="Enable GT2">
              <BooleanInput stateHook={[get.enableGT2, set.setEnableGT2]} />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable HTD">
              <BooleanInput stateHook={[get.enableHTD, set.setEnableHTD]} />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable RT25">
              <BooleanInput stateHook={[get.enableRT25, set.setEnableRT25]} />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Min Teeth">
              <NumberInput
                stateHook={[get.minPulleyTeeth, set.setMinPulleyTeeth]}
                disabledIf={() =>
                  !(get.enableGT2 || get.enableHTD || get.enableRT25)
                }
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Max Teeth">
              <NumberInput
                stateHook={[get.maxPulleyTeeth, set.setMaxPulleyTeeth]}
                disabledIf={() =>
                  !(get.enableGT2 || get.enableHTD || get.enableRT25)
                }
              />
            </SingleInputLine>
          </Column>
        </Columns>
        <Divider>Sprocket Settings</Divider>
        <Columns>
          <Column narrow>
            <SingleInputLine label="Enable #25">
              <BooleanInput
                stateHook={[get.enable25Chain, set.setEnable25Chain]}
              />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable #35">
              <BooleanInput
                stateHook={[get.enable35Chain, set.setEnable35Chain]}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Min Teeth">
              <NumberInput
                stateHook={[get.minSprocketTeeth, set.setMinSprocketTeeth]}
                disabledIf={() => !(get.enable25Chain || get.enable35Chain)}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Max Teeth">
              <NumberInput
                stateHook={[get.maxSprocketTeeth, set.setMaxSprocketTeeth]}
                disabledIf={() => !(get.enable25Chain || get.enable35Chain)}
              />
            </SingleInputLine>
          </Column>
        </Columns>
        <Divider>Gear Settings</Divider>
        <Columns>
          <Column narrow>
            <SingleInputLine label="Enable 20DP">
              <BooleanInput
                stateHook={[get.enable20DPGears, set.setEnable20DPGears]}
              />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable 32DP">
              <BooleanInput
                stateHook={[get.enable32DPGears, set.setEnable32DPGears]}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Min Teeth">
              <NumberInput
                stateHook={[get.minGearTeeth, set.setMinGearTeeth]}
                disabledIf={() => !(get.enable20DPGears || get.enable32DPGears)}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Max Teeth">
              <NumberInput
                stateHook={[get.maxGearTeeth, set.setMaxGearTeeth]}
                disabledIf={() => !(get.enable20DPGears || get.enable32DPGears)}
              />
            </SingleInputLine>
          </Column>
        </Columns>
        <Columns>
          <Column narrow>
            <SingleInputLine label="Enable NEO Pinions">
              <BooleanInput
                stateHook={[get.enableNEOPinions, set.setEnableNEOPinions]}
              />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable Falcon Pinions">
              <BooleanInput
                stateHook={[
                  get.enableFalconPinions,
                  set.setEnableFalconPinions,
                ]}
              />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable 775 Pinions">
              <BooleanInput
                stateHook={[get.enable775Pinions, set.setEnable775Pinions]}
              />
            </SingleInputLine>
          </Column>
          <Column narrow>
            <SingleInputLine label="Enable 550 Pinions">
              <BooleanInput
                stateHook={[get.enable550Pinions, set.setEnable550Pinions]}
              />
            </SingleInputLine>
          </Column>
        </Columns>
      </>
      {isLoading && <div id="loading" />}
      <Columns centered>
        <Column ofTwelve={10}>
          <table className="table is-hoverable is-fullwidth is-bordered">
            <thead>
              <tr>
                <th>Ratio</th>
                <th colSpan={get.maxStages * 2}>Stages</th>
              </tr>
            </thead>
            <tbody>
              {gearboxes
                .sort((a, b) => a.compare(b, get.targetReduction))
                .slice(0, displayNum)
                .map((gb) => (
                  <GearboxRows gearbox={gb} maxStages={get.maxStages} />
                ))}
            </tbody>
          </table>
          {gearboxes.length - displayNum > 20 && (
            <>{gearboxes.length - displayNum} more...</>
          )}
        </Column>
      </Columns>
    </>
  );
}
