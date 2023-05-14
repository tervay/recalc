import Tippy from "@tippyjs/react";
import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { BooleanInput, NumberInput } from "common/components/io/new/inputs";
import { Column, Columns, Divider } from "common/components/styling/Building";
import { Gearbox } from "common/models/Gearbox";
import { useGettersSetters } from "common/tooling/conversion";
import { wrap } from "common/tooling/promise-worker";
import { useEffect, useState } from "react";
import { animateFill } from "tippy.js";
import ratioFinderConfig, {
  RatioFinderParamsV1,
  RatioFinderStateV1,
} from "web/calculators/ratioFinder";
import { RatioFinderState } from "web/calculators/ratioFinder/converter";
import { RatioFinderWorkerFunctions } from "web/calculators/ratioFinder/math";
import rawWorker from "web/calculators/ratioFinder/math?worker";

const worker = await wrap<RatioFinderWorkerFunctions>(new rawWorker());

export default function RatioFinderCalculator(): JSX.Element {
  const [get, set] = useGettersSetters(
    RatioFinderState.getState() as RatioFinderStateV1
  );

  const [gearboxes, setGearboxes] = useState([] as Gearbox[]);

  useEffect(() => {
    worker.generateOptions(get).then((r) => {
      setGearboxes(r.map((obj) => Gearbox.fromObj(obj)));
    });
  }, [get.enable20DPGears, get.enable32DPGears]);

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
      <Columns centered>
        <Column ofTwelve={6}>
          <table className="table is-hoverable is-fullwidth">
            <thead>
              <tr>
                <th># Stages</th>
                <th colSpan={get.maxStages}>Stages</th>
                <th>Net Reduction</th>
              </tr>
            </thead>
            <tbody>
              {gearboxes
                .sort((a, b) => a.compare(b, get.targetReduction))
                .slice(0, displayNum)
                .map((gb) => (
                  <tr>
                    <td>{gb.getStages()}</td>
                    {gb.stages.map((s) => (
                      <td>
                        <Tippy
                          content={s.motionSource}
                          animateFill
                          plugins={[animateFill]}
                          allowHTML
                        >
                          <span className="underline-for-tooltip">
                            {s.driving}:{s.driven}
                          </span>
                        </Tippy>
                      </td>
                    ))}
                    <td>{gb.getRatio()}:1</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {gearboxes.length - displayNum} more...
        </Column>
      </Columns>
    </>
  );
}
