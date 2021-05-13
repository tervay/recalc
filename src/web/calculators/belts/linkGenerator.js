import { VBeltGuysInventory } from "common/models/Inventory";
import Measurement from "common/models/Measurement";
import propTypes from "prop-types";

import { checkForBelt, scanInventory } from "./vBeltGuysInventory";

export function MakeVBeltGuysLink(teeth, pitch, width) {
  const length = Math.round(pitch.mul(teeth).to("mm").scalar);
  const zeroPad = (num, places) => String(num).padStart(places, "0");

  return `https://www.vbeltguys.com/products/${length}-${
    pitch.to("mm").scalar
  }m-${zeroPad(width, 2)}-synchronous-timing-belt`;
}

function ScannableResult(props) {
  let beltScan = scanInventory(
    MakeVBeltGuysLink(props.teeth, props.pitch, props.width)
  );

  let div = <></>;
  if ((beltScan.found && beltScan.has) || !beltScan.found) {
    div = (
      <tr>
        <th>
          <a href={MakeVBeltGuysLink(props.teeth, props.pitch, props.width)}>
            VBeltGuys
          </a>
        </th>
        <td></td>
        <td>{props.pitch.format()}</td>
        <td>{props.teeth}</td>
        <td>{props.width}mm</td>
      </tr>
    );

    if (!beltScan.found) {
      checkForBelt(props.teeth, props.pitch, props.width);
    }
  }

  return div;
}

ScannableResult.propTypes = {
  teeth: propTypes.number,
  pitch: propTypes.instanceOf(Measurement),
  width: propTypes.number,
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
          width={9}
        />
        <ScannableResult
          teeth={props.smallBelt}
          pitch={props.pitch}
          width={15}
        />

        {tabulate(props.largeAvailable)}
        {props.largeBelt != 0 && (
          <>
            <ScannableResult
              teeth={props.largeBelt}
              pitch={props.pitch}
              width={9}
            />
            <ScannableResult
              teeth={props.largeBelt}
              pitch={props.pitch}
              width={15}
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
      pitch.to("mm").scalar.toString() === beltObj.pitch.replace("mm", "")
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
