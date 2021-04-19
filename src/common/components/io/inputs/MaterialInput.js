import Material, { materialMap } from "common/models/Material";
import propTypes from "prop-types";
import { useEffect, useState } from "react";

export default function MaterialInput(props) {
  const [material, setMaterial] = props.stateHook;
  const [materialName, setMaterialName] = useState(material.name);

  useEffect(() => {
    setMaterial(new Material(materialName));
  }, [materialName]);

  return (
    <div className="field is-horizontal">
      <div className="field-label is-normal">
        <label className="label">{props.label}</label>
      </div>
      <div className="field-body">
        <p className="control">
          <span className="select">
            <select
              defaultValue={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
            >
              {Object.keys(materialMap).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </span>
        </p>
      </div>
    </div>
  );
}

MaterialInput.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
  label: propTypes.string,
};
