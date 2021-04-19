import Compressor from "common/models/Compressor";
import propTypes from "prop-types";
import { useEffect, useState } from "react";

export default function CompressorInput(props) {
  const [compressor, setCompressor] = props.stateHook;
  const [compressorName, setCompressorName] = useState(compressor.name);

  useEffect(() => {
    setCompressor(new Compressor(compressorName));
  }, [compressorName]);

  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">Compressor</label>
      </div>
      <div className="field-body">
        <p className="control">
          <span className="select">
            <select
              defaultValue={compressorName}
              onChange={(e) => setCompressorName(e.target.value)}
            >
              {Compressor.getAllCompressors().map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </span>
        </p>
      </div>
    </div>
  );
}

CompressorInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
};
