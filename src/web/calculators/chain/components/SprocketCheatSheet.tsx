import Chain, { chainPitchMap } from "common/models/Chain";
import _data from "common/models/data/sprockets.json";
import { FRCVendor } from "common/models/ExtraTypes";
import Sprocket from "common/models/Sprocket";
import React from "react";

export default function SprocketCheatSheet(props: {
  chainType: Chain;
  currentSprockets: Sprocket[];
}): JSX.Element {
  const sprocketTeeth = props.currentSprockets.map((s) => s.teeth);

  const data = _data
    .map((s) => {
      return new Sprocket(s.teeth, chainPitchMap[s.chain], {
        bore: s.bore,
        vendors: s.vendors as FRCVendor[],
        wrong: s.wrong,
      });
    })
    .filter((s) => s.pitch.eq(props.chainType.pitch));

  const VendorList = (vendors: FRCVendor[]) =>
    vendors
      .map<React.ReactNode>((v) => <span key={v + Math.random()}>{v}</span>)
      .reduce((p, c) => [p, ", ", c]);

  return (
    <>
      <table className="table table-compact w-full">
        <thead>
          <tr>
            <th colSpan={5}>Matching COTS Sprockets</th>
          </tr>
          <tr>
            <th>Vendor</th>
            <th>Pitch</th>
            <th>Teeth</th>
            <th>PD</th>
            <th>Bore</th>
          </tr>
        </thead>
        <tbody>
          {data.map((sprocket) => (
            <tr
              key={JSON.stringify(sprocket)}
              className={[
                sprocketTeeth.includes(sprocket.teeth) ? "emphasize-row" : "",
                "hover",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
              <td>{VendorList(sprocket.vendors!)}</td>
              <td>{sprocket.pitch.format()}</td>
              <td>{sprocket.teeth}T</td>
              <td>
                {sprocket.pitchDiameter.to("in").toPrecision(0.001).scalar}"
              </td>
              <td className="is-size-7">{sprocket.bore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
