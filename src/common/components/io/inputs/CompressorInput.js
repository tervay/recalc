import { compressorMap } from "common/tooling/compressors";
import React, { useEffect, useState } from "react";

export default function CompressorInput(props) {
  const [compressor, setCompressor] = props.stateHook;
  const [compressorName, setCompressorName] = useState(compressor.name);

  useEffect(() => {
    setCompressor(compressorMap[compressorName]);
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
              {Object.keys(compressorMap).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </span>
        </p>
      </div>
    </div>
  );
}
