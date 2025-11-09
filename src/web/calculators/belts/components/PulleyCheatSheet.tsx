import Measurement from "common/models/Measurement";
import Pulley, { SimplePulley } from "common/models/Pulley";
import { zJSONPulley, type JSONPulley } from "common/models/types/pulleys";
import { useMemo } from "react";
import { z } from "zod";

import revPulleys from "generated/rev/pulleys.json";
import ttbPulleys from "generated/ttb/pulleys.json";
import wcpPulleys from "generated/wcp/pulleys.json";

export function PulleyCheatSheet(props: {
  pitch: Measurement;
  currentPulleys: SimplePulley[];
}): JSX.Element {
  const allPulleys: JSONPulley[] = useMemo(
    () =>
      z.array(zJSONPulley).parse([...wcpPulleys, ...ttbPulleys, ...revPulleys]),
    [],
  );

  const data = allPulleys
    .map((p) => Pulley.fromJson(p))
    .filter(
      (p) =>
        p.pitch.eq(props.pitch) &&
        props.currentPulleys.map((pulley) => pulley.teeth).includes(p.teeth),
    )
    .sort((a, b) => {
      const aVendor = a.vendor ?? "";
      const bVendor = b.vendor ?? "";
      return aVendor.localeCompare(bVendor) || a.teeth - b.teeth;
    });

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
              <tr key={pulley.sku ?? pulley.url}>
                <td>
                  <a target={"_blank"} href={pulley.url ?? "#"}>
                    {pulley.vendor ?? "N/A"}
                  </a>
                </td>
                <td>{pulley.profile}</td>
                <td className="has-text-right">
                  {pulley.pitch.format().replace(" ", " ")}
                </td>
                <td className="has-text-right">
                  {pulley.width ? `${pulley.width.to("mm").scalar} mm` : "N/A"}
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
