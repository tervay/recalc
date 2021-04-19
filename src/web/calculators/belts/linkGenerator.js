import Measurement from "common/models/Measurement";
import propTypes from "prop-types";

function MakeVBeltGuysLink(teeth, pitch, width) {
  const length = Math.round(pitch.mul(teeth).to("mm").scalar);
  const zeroPad = (num, places) => String(num).padStart(places, "0");

  return `https://www.vbeltguys.com/products/${length}-${
    pitch.to("mm").scalar
  }m-${zeroPad(width, 2)}-synchronous-timing-belt`;
}

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
        <tr>
          <th>
            <a href={MakeVBeltGuysLink(props.smallBelt, props.pitch, 9)}>
              VBeltGuys
            </a>
          </th>
          <td></td>
          <td>{props.pitch.format()}</td>
          <td>{props.smallBelt}</td>
          <td>9mm</td>
        </tr>
        <tr>
          <th>
            <a href={MakeVBeltGuysLink(props.smallBelt, props.pitch, 15)}>
              VBeltGuys
            </a>
          </th>
          <td></td>
          <td>{props.pitch.format()}</td>
          <td>{props.smallBelt}</td>
          <td>15mm</td>
        </tr>

        {tabulate(props.largeAvailable)}
        {props.largeBelt != 0 && (
          <>
            <tr>
              <th>
                <a href={MakeVBeltGuysLink(props.largeBelt, props.pitch, 9)}>
                  VBeltGuys
                </a>
              </th>
              <td></td>
              <td>{props.pitch.format()}</td>
              <td>{props.largeBelt}</td>
              <td>9mm</td>
            </tr>
            <tr>
              <th>
                <a href={MakeVBeltGuysLink(props.largeBelt, props.pitch, 15)}>
                  VBeltGuys
                </a>
              </th>
              <td></td>
              <td>{props.pitch.format()}</td>
              <td>{props.largeBelt}</td>
              <td>15mm</td>
            </tr>
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
      // console.log(belt.teeth + ' equals ' + props.smallBelt + ' with pitch ' + props.pitch.format());
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
  data: propTypes.object,
};
