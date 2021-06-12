import { VBeltGuysInventory } from "common/models/Inventory";
import Measurement from "common/models/Measurement";
import propTypes from "prop-types";

const inv = new VBeltGuysInventory();
inv.authenticate();

function ScannableResult(props) {
  let beltScan = inv.scanInventory({ ...props });

  let div = <></>;
  if ((beltScan.found && beltScan.has) || !beltScan.found) {
    div = (
      <tr>
        <th>
          <a href={inv.objToUrl({ ...props })}>VBeltGuys</a>
        </th>
        <td></td>
        <td>{props.pitch.format()}</td>
        <td>{props.teeth}</td>
        <td>{Number(props.width.to("mm").scalar.toFixed(2))} mm</td>
      </tr>
    );

    if (!beltScan.found) {
      inv.pingWebsite({ ...props });
    }
  }

  return div;
}

ScannableResult.propTypes = {
  teeth: propTypes.number,
  pitch: propTypes.instanceOf(Measurement),
  width: propTypes.instanceOf(Measurement),
};

function AvailableToHtml(props) {
  const tabulate = (available) => {
    return available.map((belt) => (
      <tr
        key={belt.type + belt.teeth + belt.width + belt.pitch + Math.random()}
      >
        <th>
          <a href={belt.url}>{belt.vendor}</a>
        </th>
        <td>{belt.type}</td>
        <td>{belt.pitch}</td>
        <td>{belt.teeth}</td>
        <td>{belt.width}</td>
      </tr>
    ));
  };

  return (
    <table className="table is-fullwidth is-hoverable">
      <thead>
        <tr>
          <th>Vendor</th>
          <th>Type</th>
          <th>Pitch</th>
          <th>Teeth</th>
          <th>Width</th>
        </tr>
      </thead>
      <tbody>
        {tabulate(props.smallAvailable)}
        <ScannableResult
          teeth={props.smallBelt}
          pitch={props.pitch}
          width={new Measurement(9, "mm")}
        />
        <ScannableResult
          teeth={props.smallBelt}
          pitch={props.pitch}
          width={new Measurement(15, "mm")}
        />

        {tabulate(props.largeAvailable)}
        {props.largeBelt != 0 && (
          <>
            <ScannableResult
              teeth={props.largeBelt}
              pitch={props.pitch}
              width={new Measurement(9, "mm")}
            />
            <ScannableResult
              teeth={props.largeBelt}
              pitch={props.pitch}
              width={new Measurement(15, "mm")}
            />
          </>
        )}
      </tbody>
    </table>
  );
}

AvailableToHtml.propTypes = {
  smallAvailable: propTypes.array,
  largeAvailable: propTypes.array,
  smallBelt: propTypes.number,
  largeBelt: propTypes.number,
  pitch: propTypes.instanceOf(Measurement),
};

export default function LinkGenerator(props) {
  let smallAvailable = [],
    largeAvailable = [];

  const isValidBelt = (beltObj, teeth, pitch) => {
    return (
      beltObj.teeth === teeth &&
      pitch.to("mm").scalar.toString() === beltObj.pitch.replace(" mm", "")
    );
  };

  props.data.forEach((belt) => {
    if (isValidBelt(belt, props.smallBelt, props.pitch)) {
      smallAvailable.push(belt);
    }
    if (isValidBelt(belt, props.largeBelt, props.pitch)) {
      largeAvailable.push(belt);
    }
  });

  return (
    <>
      <AvailableToHtml
        smallAvailable={smallAvailable}
        largeAvailable={largeAvailable}
        smallBelt={props.smallBelt}
        largeBelt={props.largeBelt}
        pitch={props.pitch}
      />
    </>
  );
}

LinkGenerator.propTypes = {
  smallBelt: propTypes.number,
  largeBelt: propTypes.number,
  pitch: propTypes.instanceOf(Measurement),
  data: propTypes.any,
};
