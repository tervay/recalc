import SimpleHeading from "common/components/heading/SimpleHeading";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { BooleanInput, NumberInput } from "common/components/io/new/inputs";
import L0MultiBoolean from "common/components/io/new/inputs/L0/L0MultiBoolean";
import { Column, Columns, Divider } from "common/components/styling/Building";
import { Bore, MotorBores } from "common/models/ExtraTypes";
import {
  DrivingDriven,
  Gearbox2,
  MMTypeStr,
  MotionMethod,
} from "common/models/Gearbox";
import { useGettersSetters } from "common/tooling/conversion";
import { wrap } from "common/tooling/promise-worker";
import groupBy from "lodash/groupBy";
import sumBy from "lodash/sumBy";
import React, { useEffect, useState } from "react";
import ratioFinderConfig, {
  RatioFinderParamsV1,
  RatioFinderStateV1,
} from "web/calculators/ratioFinder";
import { RatioFinderState } from "web/calculators/ratioFinder/converter";
import { RatioFinderWorkerFunctions } from "web/calculators/ratioFinder/math";
import rawWorker from "web/calculators/ratioFinder/math?worker";

const worker = await wrap<RatioFinderWorkerFunctions>(new rawWorker());

function overlappingDrivingDrivenMethods(
  methods: DrivingDriven,
  excludePinions: boolean
): DrivingDriven {
  let good: DrivingDriven = { driven: [], driving: [] };

  methods.driving.forEach((driving, i) => {
    if (excludePinions && MotorBores.includes(driving.bore)) {
      return;
    }

    const matchingType = methods.driven.filter(
      (driven) =>
        driven.type === driving.type &&
        (MMTypeStr(driven) === MMTypeStr(driving) ||
          driving.type === "Planetary")
    );

    if (matchingType.length > 0) {
      good.driving.push(driving);

      matchingType.forEach((mt) => {
        if (!good.driven.includes(mt)) {
          good.driven.push(mt);
        }
      });
    }
  });

  return good;
}

function MotionMethodCell(props: {
  motionMethods: MotionMethod[];
  excludePinions?: boolean;
}): JSX.Element {
  let mms = props.motionMethods;
  if (props.excludePinions === true) {
    mms = mms.filter(
      (m) => !MotorBores.includes(m.bore) || m.type === "Planetary"
    );
  }

  let gb = groupBy(mms, (m) => m.bore);
  const bores = props.excludePinions
    ? Object.keys(gb).filter((k) => !MotorBores.includes(k as Bore))
    : Object.keys(gb);

  let x: { [bore: string]: { [mmType: string]: MotionMethod[] } } = {};
  bores.forEach((bore) => {
    x[bore] = groupBy(gb[bore], (mm) => MMTypeStr(mm));
  });

  let tableRows: JSX.Element[] = [];
  Object.keys(x).forEach((bore, boreIndex) => {
    let firstTd: JSX.Element = <></>;

    const totalWithBore = sumBy(Object.keys(x[bore]), (k) => x[bore][k].length);
    firstTd = <td rowSpan={totalWithBore}>{bore}</td>;

    Object.keys(x[bore]).forEach((mmType, mmTypeIndex) => {
      let secondTd: JSX.Element = <></>;
      const totalWithMMType = x[bore][mmType].length;
      secondTd = <td rowSpan={totalWithMMType}>{mmType}</td>;

      tableRows.push();

      x[bore][mmType].forEach((mm, i) => {
        tableRows.push(
          <tr key={`${Math.random()}`}>
            {firstTd}
            {secondTd}
            <td style={{ width: "100%", whiteSpace: "nowrap" }}>
              <a href={mm.url}>{mm.partNumber}</a>
            </td>
          </tr>
        );

        firstTd = <></>;
        secondTd = <></>;
      });
    });
  });

  return (
    <>
      <table className="table is-fullwidth is-narrow p-0">
        <thead>
          <tr>
            <th>Bore</th>
            <th>Type</th>
            <th>P/N</th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
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
        {props.gearbox.stages.map((stage, i) => {
          let overlapping = overlappingDrivingDrivenMethods(
            {
              driven: stage.drivenMethods,
              driving: stage.drivingMethods,
            },
            i > 0
          );

          console.log(stage, overlapping);

          return (
            <React.Fragment key={i}>
              <td
                colSpan={1}
                className="has-text-centered unset-va thick-bottom-border p-0"
              >
                <MotionMethodCell
                  motionMethods={overlapping.driving}
                  excludePinions={i > 0}
                />
              </td>
              <td
                colSpan={1}
                className="has-text-centered unset-va thick-bottom-border p-0"
              >
                <MotionMethodCell
                  motionMethods={overlapping.driven}
                  excludePinions
                />
              </td>
            </React.Fragment>
          );
        })}
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
    get.reductionError,
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
    get.enable12HexBore,
    get.enable38HexBore,
    get.enableBearingBore,
    get.enable875Bore,
    get.enableMaxSpline,
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
            <Column>
              <Column>
                <Columns formColumns>
                  <Column ofTwelve={6}>
                    <SingleInputLine label="Target Reduction">
                      <NumberInput
                        stateHook={[
                          get.targetReduction,
                          set.setTargetReduction,
                        ]}
                        delay={500}
                      />
                    </SingleInputLine>
                  </Column>
                  <Column>
                    <SingleInputLine label="Min Stages">
                      <NumberInput
                        stateHook={[get.minStages, set.setMinStages]}
                        delay={500}
                      />
                    </SingleInputLine>
                  </Column>
                </Columns>
              </Column>
              <Column>
                <Columns formColumns>
                  <Column ofTwelve={6}>
                    <SingleInputLine
                      label="Reduction Error Threshold"
                      tooltip={`Will filter out ratios that aren't between ${
                        get.targetReduction - get.reductionError
                      } and ${get.targetReduction + get.reductionError}.`}
                    >
                      <NumberInput
                        stateHook={[get.reductionError, set.setReductionError]}
                        delay={500}
                      />
                    </SingleInputLine>
                  </Column>

                  <Column>
                    <SingleInputLine label="Max Stages">
                      <NumberInput
                        stateHook={[get.maxStages, set.setMaxStages]}
                        delay={500}
                      />
                    </SingleInputLine>
                  </Column>
                </Columns>
                <Columns formColumns>
                  <Column>
                    <SingleInputLine
                      label="Start Gearbox With Motor"
                      tooltip="If enabled, the first bore will be a motor bore. If disabled, the first bore will not be a motor bore."
                    >
                      <BooleanInput
                        stateHook={[
                          get.firstPartPinion,
                          set.setFirstPartPinion,
                        ]}
                      />
                    </SingleInputLine>
                  </Column>
                  <Column>
                    <SingleInputLine label="Display Results">
                      <NumberInput stateHook={[displayNum, setDisplayNum]} />
                    </SingleInputLine>
                  </Column>
                </Columns>

                <Columns>
                  <Column>
                    <Divider extraClasses="mt-0">Gear Tooth Range</Divider>
                    <SingleInputLine label="Min">
                      <NumberInput
                        stateHook={[get.minGearTeeth, set.setMinGearTeeth]}
                        disabledIf={() =>
                          !(get.enable20DPGears || get.enable32DPGears)
                        }
                      />
                    </SingleInputLine>
                    <SingleInputLine label="Max">
                      <NumberInput
                        stateHook={[get.maxGearTeeth, set.setMaxGearTeeth]}
                        disabledIf={() =>
                          !(get.enable20DPGears || get.enable32DPGears)
                        }
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
                        stateHook={[
                          get.minSprocketTeeth,
                          set.setMinSprocketTeeth,
                        ]}
                        disabledIf={() =>
                          !(get.enable25Chain || get.enable35Chain)
                        }
                      />
                    </SingleInputLine>
                    <SingleInputLine label="Max">
                      <NumberInput
                        stateHook={[
                          get.maxSprocketTeeth,
                          set.setMaxSprocketTeeth,
                        ]}
                        disabledIf={() =>
                          !(get.enable25Chain || get.enable35Chain)
                        }
                      />
                    </SingleInputLine>
                  </Column>
                </Columns>
              </Column>
              {isLoading ? (
                <div id="loading" />
              ) : (
                <div className="is-size-5 p-2 has-text-centered">
                  {gearboxes.length} gearboxes found
                </div>
              )}
              <div className="notification is-warning is-light content pt-1 px-1">
                <ul>
                  <li>
                    Be sure to review the{" "}
                    <a href="https://docs.google.com/gview?url=https://link.vex.com/vexpro/pdf/VersaPlanetary-LoadRatings&embedded=true">
                      VP Load Ratings
                    </a>{" "}
                    as this does not account for them.
                  </li>
                  <li>
                    Planetaries won't show if their respective vendors are
                    disabled. (e.g. both REV and MAX Planetaries must be enabled
                    to see MAX Planetaries.)
                  </li>
                  <li>Planetary part numbers are not accurate.</li>
                  <li>Currently missing all WCP.</li>
                  <li>
                    3+ stage generation can be slow. Try limiting tooth ranges
                    or reducing error threshold.
                  </li>
                </ul>
              </div>
            </Column>
          </Column>
          <Column>
            <Columns multiline>
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
                      name: "MAX Planetaries",
                      stateHook: [get.enableMPs, set.setEnableMPs],
                    },
                    {
                      name: "57 Sports",
                      stateHook: [get.enableSports, set.setEnableSports],
                    },
                    {
                      name: "VersaPlanetaries",
                      stateHook: [get.enableVPs, set.setEnableVPs],
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
                      stateHook: [
                        get.enableNEOPinions,
                        set.setEnableNEOPinions,
                      ],
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
                      stateHook: [
                        get.enable775Pinions,
                        set.setEnable775Pinions,
                      ],
                    },
                    {
                      name: "550",
                      stateHook: [
                        get.enable550Pinions,
                        set.setEnable550Pinions,
                      ],
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
                      stateHook: [
                        get.enableBearingBore,
                        set.setEnableBearingBore,
                      ],
                    },
                    {
                      name: "MAXSpline",
                      stateHook: [get.enableMaxSpline, set.setEnableMaxSpline],
                    },
                  ]}
                />
              </Column>
            </Columns>
            <Columns>
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
                      stateHook: [get.enable25Chain, set.setEnable25Chain],
                    },
                    {
                      name: "#35",
                      stateHook: [get.enable35Chain, set.setEnable35Chain],
                    },
                  ]}
                />
              </Column>
            </Columns>
          </Column>
        </Columns>
      </>
      <Columns centered>
        <Column ofTwelve={12}>
          <div className="table-container">
            <table className="table is-hoverable is-fullwidth is-bordered">
              <thead>
                <tr>
                  <th>Ratio</th>
                  <th colSpan={get.maxStages * 2} style={{ width: "100%" }}>
                    Stages
                  </th>
                </tr>
              </thead>
              <tbody>
                {gearboxes
                  .sort((a, b) => a.compare(b, get.targetReduction))
                  .slice(0, displayNum)
                  .map((gb, i) => (
                    <GearboxRows
                      gearbox={gb}
                      maxStages={get.maxStages}
                      key={i}
                    />
                  ))}
              </tbody>
            </table>
          </div>
          {gearboxes.length - displayNum > 20 && (
            <>{gearboxes.length - displayNum} more...</>
          )}
        </Column>
      </Columns>
    </>
  );
}
