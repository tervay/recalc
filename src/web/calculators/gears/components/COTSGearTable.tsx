import amGears from "common/models/data/cots/andymark/gears.json";
import revGears from "common/models/data/cots/rev/gears.json";
import vexGears from "common/models/data/cots/vex/gears.json";
import wcpGears from "common/models/data/cots/wcp/gears.json";

export default function GearCheatSheet(props: {
  gear1Teeth: number;
  gear2Teeth: number;
  gearDP: number;
}): JSX.Element {
  const data = [...revGears, ...wcpGears, ...amGears, ...vexGears].filter(
    (g) =>
      g.dp === props.gearDP &&
      (g.teeth === props.gear1Teeth || g.teeth === props.gear2Teeth),
  );

  return (
    <>
      <div className="table-container">
        <table className="table is-hoverable is-narrow is-fullwidth">
          <thead>
            <tr>
              <th colSpan={4}>Matching COTS Gears</th>
            </tr>
            <tr>
              <th>Vendor</th>
              <th>DP</th>
              <th>Teeth</th>
              <th>Bore</th>
            </tr>
          </thead>
          <tbody>
            {data
              .sort(
                (a, b) =>
                  a.vendor.localeCompare(b.vendor) ||
                  a.teeth - b.teeth ||
                  a.bore.localeCompare(b.bore),
              )
              .map((gear) => (
                <tr key={JSON.stringify(gear)}>
                  <td>
                    <a href={gear.url}>{gear.vendor}</a>
                  </td>
                  <td>{gear.dp}</td>
                  <td>{gear.teeth}T</td>
                  <td className="is-size-7">{gear.bore}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
