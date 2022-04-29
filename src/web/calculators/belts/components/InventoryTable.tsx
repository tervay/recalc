import Belt from "common/models/Belt";
import VBeltGuysInventory from "common/models/inventories/VBeltGuysInventory";
import Measurement from "common/models/Measurement";
import usePromise from "react-use-promise";

const vbg = new VBeltGuysInventory({
  allowAuth: true,
  authCb: null,
  offlineData: null,
});
vbg.authenticate();

const frcBelts: Belt[] = Belt.getAllBelts();

function frcAvailableRows(belt: Belt): JSX.Element[] {
  return frcBelts
    .filter((b) => b.eq(belt))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .filter((b) => b.width?.eq(belt.width!))
    .map((b) => (
      <tr
        key={(b.url === undefined ? "" : b.url) + b.teeth + b.width?.format()}
      >
        <th>
          <a target={"_blank"} href={b.url}>
            {b.vendor}
          </a>
        </th>
        <td>{b.type}</td>
        <td>{b.pitch.format()}</td>
        <td>{b.teeth}</td>
        <td>{b.width?.format()}</td>
      </tr>
    ));
}

function VbgAvailableRows(props: { belt: Belt }): JSX.Element {
  const scan = vbg.scanInventory(props.belt);
  const [result, _, state] = usePromise(
    !scan.found
      ? vbg.pingSite(props.belt)
      : new Promise((resolve) => resolve(208)),
    [props.belt]
  );

  let div = <></>;
  const showDiv =
    (scan.found && scan.has === true) ||
    (state === "resolved" && result === 200);

  if (showDiv) {
    div = (
      <tr>
        <th>
          <a target={"_blank"} href={vbg.makeUrl(props.belt)}>
            VBeltGuys
          </a>
        </th>
        <td>HTD</td>
        <td>{props.belt.pitch.format()}</td>
        <td>{props.belt.teeth}</td>
        <td>{props.belt.width?.format()}</td>
      </tr>
    );
  }

  return div;
}

export default function InventoryTable(props: {
  smallerTeeth: number;
  largerTeeth?: number;
  pitch: Measurement;
}): JSX.Element {
  const tHead = (
    <thead>
      <tr>
        <th colSpan={5}>
          Matching COTS Belts&nbsp;<a href="/data/belts">(all belts)</a>
        </th>
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

  const smallVbgDivs = (
    <>
      <VbgAvailableRows
        belt={Belt.fromTeeth(
          props.smallerTeeth,
          props.pitch,
          new Measurement(9, "mm")
        )}
      />
      <VbgAvailableRows
        belt={Belt.fromTeeth(
          props.smallerTeeth,
          props.pitch,
          new Measurement(15, "mm")
        )}
      />
    </>
  );
  let vbgDivs = smallVbgDivs;
  if (props.largerTeeth !== undefined) {
    vbgDivs = (
      <>
        {smallVbgDivs}
        <VbgAvailableRows
          belt={Belt.fromTeeth(
            props.largerTeeth,
            props.pitch,
            new Measurement(9, "mm")
          )}
        />
        <VbgAvailableRows
          belt={Belt.fromTeeth(
            props.largerTeeth,
            props.pitch,
            new Measurement(15, "mm")
          )}
        />
      </>
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
              {frcAvailableRows(
                Belt.fromTeeth(
                  props.smallerTeeth,
                  props.pitch,
                  new Measurement(9, "mm")
                )
              )}
              {frcAvailableRows(
                Belt.fromTeeth(
                  props.smallerTeeth,
                  props.pitch,
                  new Measurement(15, "mm")
                )
              )}
              {props.largerTeeth &&
                frcAvailableRows(
                  Belt.fromTeeth(
                    props.largerTeeth,
                    props.pitch,
                    new Measurement(9, "mm")
                  )
                )}
              {props.largerTeeth &&
                frcAvailableRows(
                  Belt.fromTeeth(
                    props.largerTeeth,
                    props.pitch,
                    new Measurement(15, "mm")
                  )
                )}
              {vbgDivs}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
