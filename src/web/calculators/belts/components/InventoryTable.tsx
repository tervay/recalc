import Measurement from "common/models/Measurement";
import { JSONBelt, zJSONBelt } from "common/models/types/belts";

import revBelts from "generated/rev/belts.json";
import swyftBelts from "generated/swyft/belts.json";
import vbgBelts from "generated/vbg/belts.json";
import wcpBelts from "generated/wcp/belts.json";

const belts: JSONBelt[] = [
  ...swyftBelts,
  ...vbgBelts,
  ...wcpBelts,
  ...revBelts,
].map((b) => zJSONBelt.parse(b));

function frcAvailableRows(teeth: number, pitch: Measurement): JSX.Element[] {
  return belts
    .filter((b) => pitch.eq(new Measurement(b.pitch, "mm")))
    .filter((b) => b.teeth === teeth)
    .map((b) => (
      <tr
        key={
          b.sku ??
          (b.url === undefined ? "" : b.url) +
            b.teeth +
            new Measurement(b.width, "mm").format()
        }
      >
        <th>
          <a target={"_blank"} href={b.url}>
            {b.vendor}
          </a>
        </th>
        <td>{b.profile}</td>
        <td>
          {new Measurement(
            b.pitch,
            b.profile === "RT25" ? "in" : "mm",
          ).format()}
        </td>
        <td>{b.teeth}</td>
        <td>
          {new Measurement(
            b.width,
            b.profile === "RT25" ? "in" : "mm",
          ).format()}
        </td>
      </tr>
    ));
}

export default function InventoryTable(props: {
  smallerTeeth: number;
  largerTeeth?: number;
  pitch: Measurement;
}): JSX.Element {
  const tHead = (
    <thead>
      <tr>
        <th colSpan={5}>Matching COTS Belts</th>
      </tr>
      <tr>
        <th>Vendor</th>
        <th>Type</th>
        <th>Pitch</th>
        <th>Teeth</th>
        <th>Width</th>
      </tr>
    </thead>
  );

  if (props.smallerTeeth === 0) {
    return (
      <table className="table is-fullwidth is-narrow is-hoverable">
        {tHead}
      </table>
    );
  }

  const id = "inventory-table";
  return (
    <div id={id} data-testid={id} style={{ paddingBottom: "8px" }}>
      <div className="table-container">
        <div className="table-container2">
          <table className="table is-fullwidth is-narrow is-hoverable">
            {tHead}
            <tbody>
              {frcAvailableRows(props.smallerTeeth, props.pitch)}
              {props.largerTeeth &&
                frcAvailableRows(props.largerTeeth, props.pitch)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
