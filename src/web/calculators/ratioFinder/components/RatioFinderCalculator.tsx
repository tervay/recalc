import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { BooleanInput, NumberInput } from "common/components/io/new/inputs";
import L0MultiBoolean from "common/components/io/new/inputs/L0/L0MultiBoolean";
import { Column, Columns, Divider } from "common/components/styling/Building";
import { Gearbox2, MotionMethod } from "common/models/Gearbox";
import { useGettersSetters } from "common/tooling/conversion";
import { wrap } from "common/tooling/promise-worker";
import groupBy from "lodash/groupBy";
import React, { useEffect, useState } from "react";
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
          {keys.map((k, i) => (
            <tr key={i}>
              <td>{k}</td>
              <td>
                {gb[k].map((m, i) => (
                  <React.Fragment key={i}>
                    ({m.type.slice(0, 1)}) <a href={m.url}>{m.partNumber}</a>
                    <br />
                  </React.Fragment>
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
        {props.gearbox.stages.map((stage, i) => (
          <td colSpan={2} className="has-text-centered" key={i}>
            <b>
              {stage.driving}:{stage.driven}
            </b>
          </td>
        ))}
        {emptyStages > 0 &&
          [...Array(emptyStages)].map((_, i) => <td colSpan={2} key={i}></td>)}
      </tr>

      <tr>
        {props.gearbox.stages.map((stage, i) => (
          <React.Fragment key={i}>
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
          </React.Fragment>
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
        <Columns>
          <Column>
            <SingleInputLine label="Target Reduction">
              <NumberInput
                stateHook={[get.targetReduction, set.setTargetReduction]}
              />
            </SingleInputLine>
            <SingleInputLine label="Min Reduction">
              <NumberInput
                stateHook={[get.minReduction, set.setMinReduction]}
              />
            </SingleInputLine>
            <SingleInputLine label="Max Reduction">
              <NumberInput
                stateHook={[get.maxReduction, set.setMaxReduction]}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <SingleInputLine label="Min Stages">
              <NumberInput stateHook={[get.minStages, set.setMinStages]} />
            </SingleInputLine>
            <SingleInputLine label="Max Stages">
              <NumberInput stateHook={[get.maxStages, set.setMaxStages]} />
            </SingleInputLine>
            <Columns>
              <Column>
                <SingleInputLine label="First Part Pinion">
                  <BooleanInput
                    stateHook={[get.firstPartPinion, set.setFirstPartPinion]}
                  />
                </SingleInputLine>
              </Column>
              <Column>
                <SingleInputLine label="Display Results">
                  <NumberInput stateHook={[displayNum, setDisplayNum]} />
                </SingleInputLine>
              </Column>
            </Columns>
          </Column>
        </Columns>
        <Columns>
          <Column extraClasses="px-2">
            <L0MultiBoolean
              label="Vendors"
              options={[
                {
                  name: "REV",
                  stateHook: [get.enableREV, set.setEnableREV],
                },
                {
                  name: "WCP",
                  stateHook: [get.enableWCP, set.setEnableWCP],
                },
                {
                  name: "AndyMark",
                  stateHook: [get.enableAM, set.setEnableAM],
                },
                {
                  name: "TTB",
                  stateHook: [get.enableTTB, set.setEnableTTB],
                },
                {
                  name: "VEX",
                  stateHook: [get.enableVEX, set.setEnableVEX],
                },
              ]}
            />
          </Column>
          <Column extraClasses="px-2">
            <L0MultiBoolean
              label="Planetaries"
              options={[
                {
                  name: "VersaPlanetaries",
                  stateHook: [get.enableVPs, set.setEnableVPs],
                },
                {
                  name: "MAX Planetaries",
                  stateHook: [get.enableMPs, set.setEnableMPs],
                },
                {
                  name: "57 Sports",
                  stateHook: [get.enableSports, set.setEnableSports],
                },
              ]}
            />
          </Column>
          <Column extraClasses="px-2">
            <L0MultiBoolean
              label="Gear Types"
              options={[
                {
                  name: "20 DP",
                  stateHook: [get.enable20DPGears, set.setEnable20DPGears],
                },
                {
                  name: "32 DP",
                  stateHook: [get.enable32DPGears, set.setEnable32DPGears],
                },
              ]}
            />
          </Column>
          <Column extraClasses="px-2">
            <L0MultiBoolean
              label="Pulley Types"
              options={[
                {
                  name: "GT2",
                  stateHook: [get.enableGT2, set.setEnableGT2],
                },
                {
                  name: "HTD",
                  stateHook: [get.enableHTD, set.setEnableHTD],
                },
                {
                  name: "RT25",
                  stateHook: [get.enableRT25, set.setEnableRT25],
                },
              ]}
            />
          </Column>
          <Column extraClasses="px-2">
            <L0MultiBoolean
              label="Chain Types"
              options={[
                {
                  name: "#25",
                  stateHook: [get.enable25Chain, set.setEnable35Chain],
                },
                {
                  name: "#35",
                  stateHook: [get.enable35Chain, set.setEnable35Chain],
                },
              ]}
            />
          </Column>
          <Column extraClasses="px-2">
            <L0MultiBoolean
              label="Pinion Bores"
              options={[
                {
                  name: "NEO",
                  stateHook: [get.enableNEOPinions, set.setEnableNEOPinions],
                },
                {
                  name: "Falcon",
                  stateHook: [
                    get.enableFalconPinions,
                    set.setEnableFalconPinions,
                  ],
                },
                {
                  name: "775",
                  stateHook: [get.enable775Pinions, set.setEnable775Pinions],
                },
                {
                  name: "550",
                  stateHook: [get.enable550Pinions, set.setEnable550Pinions],
                },
              ]}
            />
          </Column>
          <Column extraClasses="px-2">
            <L0MultiBoolean
              label="Other Bores"
              options={[
                {
                  name: '1/2" Hex',
                  stateHook: [get.enable12HexBore, set.setEnable12HexBore],
                },
                {
                  name: '3/8" Hex',
                  stateHook: [get.enable38HexBore, set.setEnable38HexBore],
                },
                {
                  name: '0.875"',
                  stateHook: [get.enable875Bore, set.setEnable875Bore],
                },
                {
                  name: '1.125"',
                  stateHook: [get.enableBearingBore, set.setEnableBearingBore],
                },
              ]}
            />
          </Column>
        </Columns>
        <Columns>
          <Column>
            <Divider extraClasses="mt-0">Gear Tooth Range</Divider>
            <SingleInputLine label="Min">
              <NumberInput
                stateHook={[get.minGearTeeth, set.setMinGearTeeth]}
                disabledIf={() => !(get.enable20DPGears || get.enable32DPGears)}
              />
            </SingleInputLine>
            <SingleInputLine label="Max">
              <NumberInput
                stateHook={[get.maxGearTeeth, set.setMaxGearTeeth]}
                disabledIf={() => !(get.enable20DPGears || get.enable32DPGears)}
              />
            </SingleInputLine>
          </Column>
          <Column>
            <Divider extraClasses="mt-0">Pulley Tooth Range</Divider>
            <SingleInputLine label="Min">
              <NumberInput
                stateHook={[get.minPulleyTeeth, set.setMinPulleyTeeth]}
                disabledIf={() =>
                  !(get.enableGT2 || get.enableHTD || get.enableRT25)
                }
              />
            </SingleInputLine>
            <SingleInputLine label="Max">
              <NumberInput
                stateHook={[get.maxPulleyTeeth, set.setMaxPulleyTeeth]}
                disabledIf={() =>
                  !(get.enableGT2 || get.enableHTD || get.enableRT25)
                }
              />
            </SingleInputLine>
          </Column>
          <Column>
            <Divider extraClasses="mt-0">Sprocket Tooth Range</Divider>
            <SingleInputLine label="Min">
              <NumberInput
                stateHook={[get.minSprocketTeeth, set.setMinSprocketTeeth]}
                disabledIf={() => !(get.enable25Chain || get.enable35Chain)}
              />
            </SingleInputLine>
            <SingleInputLine label="Max">
              <NumberInput
                stateHook={[get.maxSprocketTeeth, set.setMaxSprocketTeeth]}
                disabledIf={() => !(get.enable25Chain || get.enable35Chain)}
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
                .map((gb, i) => (
                  <GearboxRows gearbox={gb} maxStages={get.maxStages} key={i} />
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
