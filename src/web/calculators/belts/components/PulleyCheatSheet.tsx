import _data from "common/models/data/pulleys.json";
import { FRCVendor, PulleyBeltType } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Pulley from "common/models/Pulley";
import React from "react";

export function PulleyCheatSheet(props: {
  pitch: Measurement;
  currentPulleys: Pulley[];
}): JSX.Element {
  const currentTeeth = props.currentPulleys.map((p) => p.teeth);

  const data = _data
    .map((p) => {
      return Pulley.fromTeeth(p.teeth, new Measurement(p.pitch, "mm"), {
        vendors: p.vendors as FRCVendor[],
        type: p.type as PulleyBeltType,
        urls: p.urls as string[],
        bore: p.bore,
        widths:
          typeof p.width === "string"
            ? p.width
                .split(", ")
                .map((ws: string) => new Measurement(Number(ws), "mm"))
            : [new Measurement(p.width, "mm")],
      });
    })
    .filter((p) => p.pitch.eq(props.pitch));

  const VendorList = (vendors: FRCVendor[], urls: string[]) =>
    vendors
      .map<React.ReactNode>((v, i) => (
        <a href={urls[i]} key={v + Math.random()}>
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
                key={JSON.stringify(pulley)}
                className={
                  currentTeeth.includes(pulley.teeth) ? "emphasize-row" : ""
                }
              >
                <td className="is-size-7">
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
                  className="is-size-7 has-text-centered"
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
