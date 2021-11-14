import { Divider } from "common/components/styling/Building";
import _data from "common/models/data/pulleys.json";
import { FRCVendor, PulleyBeltType } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Pulley from "common/models/Pulley";
import React from "react";

function PulleyCheatSheet(props: { pitch: Measurement }): JSX.Element {
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
      <Divider paddingLess color="primary">
        Matching COTS Pulleys
      </Divider>
      <div className="table-container">
        <table className="table is-hoverable is-narrow is-fullwidth">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Type</th>
              <th>Pitch</th>
              <th>Width</th>
              <th>Teeth</th>
              <th>Pitch Diameter </th>
              <th>Bore</th>
            </tr>
          </thead>
          <tbody>
            {data.map((pulley) => (
              <tr key={JSON.stringify(pulley)}>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <td>{VendorList(pulley.vendors!, pulley.urls!)}</td>
                <td>{pulley.type}</td>
                <td>{pulley.pitch.format().replace(" ", "")}</td>
                <td>
                  {pulley.widths?.map((w) => w.to("mm").scalar).join(", ")}mm
                </td>
                <td>{pulley.teeth}T</td>
                <td>
                  {pulley.pitchDiameter.to("in").toPrecision(0.001).scalar}"
                </td>
                <td>{pulley.bore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export const Pulley3mmCheatSheat = React.memo(() => (
  <PulleyCheatSheet pitch={new Measurement(3, "mm")} />
));

export const Pulley5mmCheatSheat = React.memo(() => (
  <PulleyCheatSheet pitch={new Measurement(5, "mm")} />
));

export const EmptyCheatSheet = React.memo(() => (
  <PulleyCheatSheet pitch={new Measurement(999, "mm")} />
));
