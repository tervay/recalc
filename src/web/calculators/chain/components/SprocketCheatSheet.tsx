import Chain from "common/models/Chain";
import Sprocket, { SimpleSprocket } from "common/models/Sprocket";
import type { JSONSprocket } from "common/models/types/sprockets";
import ttbSprockets from "generated/ttb/sprockets.json";
import wcpSprockets from "generated/wcp/sprockets.json";

export default function SprocketCheatSheet(props: {
  chainType: Chain;
  currentSprockets: SimpleSprocket[];
}): JSX.Element {
  const sprocketTeeth = props.currentSprockets.map((s) => s.teeth);

  const allSprockets = [
    ...(wcpSprockets as JSONSprocket[]),
    ...(ttbSprockets as JSONSprocket[]),
  ];

  const data = allSprockets
    .filter((s) => s.chainType === props.chainType.chainType())
    .map((s) => Sprocket.fromJson(s))
    .toSorted(
      (a, b) =>
        a.teeth - b.teeth ||
        a.vendor.localeCompare(b.vendor) ||
        a.bore.localeCompare(b.bore),
    );

  return (
    <>
      <div className="table-container">
        <table className="table is-hoverable is-narrow is-fullwidth">
          <thead>
            <tr>
              <th colSpan={5}>Matching COTS Sprockets</th>
            </tr>
            <tr>
              <th>Vendor</th>
              <th>Pitch</th>
              <th>Teeth</th>
              <th>Bore</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, idx) => (
              <tr
                key={idx}
                className={
                  sprocketTeeth.includes(s.teeth) ? "emphasize-row" : ""
                }
              >
                <td>
                  <a target={"_blank"} href={s.url}>
                    {s.vendor}
                  </a>
                </td>
                <td>{s.pitch.format()}</td>
                <td>{s.teeth}T</td>
                <td className="is-size-7">{s.bore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
