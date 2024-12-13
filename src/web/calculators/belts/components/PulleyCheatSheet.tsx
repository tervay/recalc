// import _data from "common/models/data/pulleys.json";
import { FRCVendor, PulleyBeltType } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Pulley from "common/models/Pulley";
import React, { useMemo } from "react";

import amPulleys from "common/models/data/cots/andymark/pulleys.json";
import revPulleys from "common/models/data/cots/rev/pulleys.json";
import ttbPulleys from "common/models/data/cots/ttb/pulleys.json";
import vexPulleys from "common/models/data/cots/vex/pulleys.json";
import wcpPulleys from "common/models/data/cots/wcp/pulleys.json";

export function PulleyCheatSheet(props: {
  pitch: Measurement;
  currentPulleys: Pulley[];
}): JSX.Element {
  const allPulleys = useMemo(
    () => [
      ...revPulleys,
      ...vexPulleys,
      ...wcpPulleys,
      ...amPulleys,
      ...ttbPulleys,
    ],
    [],
  );

  console.log(props.pitch.format());

  const data = allPulleys
    .map((p) =>
      Pulley.fromTeeth(p.teeth, Measurement.fromDict(p.pitch), {
        vendors: [p.vendor as FRCVendor],
        type: p.type as PulleyBeltType,
        urls: [p.url],
        bore: p.bore,
        widths: [Measurement.fromDict(p.width)],
      }),
    )
    .filter(
      (p) =>
        p.pitch.eq(props.pitch) &&
        props.currentPulleys.map((pulley) => pulley.teeth).includes(p.teeth),
    )
    .sort(
      (a, b) => a.vendors![0].localeCompare(b.vendors![0]) || a.teeth - b.teeth,
    );

  const VendorList = (vendors: FRCVendor[], urls: string[]) =>
    vendors
      .map<React.ReactNode>((v, i) => (
        <a target={"_blank"} href={urls[i]} key={v + Math.random()}>
          {v}
        </a>
      ))
      .reduce((p, c) => [p, ", ", c]);

  return (
    <>
      <div className="table-container">
        <table className="table is-hoverable is-narrow is-fullwidth">
          <thead>
            <tr>
              <th colSpan={7}>Matching COTS Pulleys</th>
            </tr>
            <tr>
              <th>Vendor</th>
              <th>Type</th>
              <th className="has-text-right">Pitch</th>
              <th className="has-text-right">Width</th>
              <th className="has-text-right">Teeth</th>
              <th className="has-text-right">PD</th>
              <th className="has-text-centered">Bore</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pulley) => (
              <tr
                key={Math.random()}
                // className={
                //   currentTeeth.includes(pulley.teeth) ? "emphasize-row" : ""
                // }
              >
                <td>
                  {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                  {VendorList(pulley.vendors!, pulley.urls!)}
                </td>
                <td>{pulley.type}</td>
                <td className="has-text-right">
                  {pulley.pitch.format().replace(" ", " ")}
                </td>
                <td className="has-text-right">
                  {pulley.widths?.map((w) => w.to("mm").scalar).join(", ")} mm
                </td>
                <td className="has-text-centered">{pulley.teeth}T</td>
                <td className="has-text-right">
                  {pulley.pitchDiameter.to("in").toPrecision(0.001).scalar}"
                </td>
                <td
                  className="has-text-centered"
                  style={{ verticalAlign: "inherit" }}
                >
                  {pulley.bore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
