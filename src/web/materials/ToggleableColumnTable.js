import propTypes from "prop-types";
import { forwardRef, useEffect, useRef } from "react";

function zip(a, b, c) {
  let ret = [];
  for (let i = 0; i < Math.max(a.length, b.length, c.length); i++) {
    ret.push([
      i > a.length ? null : a[i],
      i > b.length ? null : b[i],
      i > c.length ? null : c[i],
    ]);
  }
  return ret;
}

const IndeterminateCheckbox = forwardRef(({ indeterminate, ...rest }, ref) => {
  const defaultRef = useRef();
  const resolvedRef = ref || defaultRef;

  useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return <input type="checkbox" ref={resolvedRef} {...rest} />;
});

IndeterminateCheckbox.displayName = "IndeterminateCheckbox";
IndeterminateCheckbox.propTypes = {
  indeterminate: propTypes.any,
};

const groups = {
  Basic: ["Material", "Name"],
  Mechanical: [
    "Density (g/cm³)",
    "Brinell Hardness",
    "Rockwell M Hardness",
    "Tensile Modulus (GPa)",
    "Elongation At Break (%)",
    "Fatigue Strength (MPa)",
    "Poisson's Ratio",
    "Shear Modulus (GPa)",
    "Shear Strength (MPa)",
    "Tensile Strength (Yield) (MPa)",
    "Tensile Strength (Ultimate) (MPa)",
    "Tensile Strength (Break) (MPa)",
    "Flexural Modulus (GPa)",
    "Flexural Strength (MPa)",
    "Izod Impact Strength (J/m)",
    "Charpy Impact Strength (J/m^2)",
  ],
  Thermal: [
    "Latent Heat of Fusion (J/g)",
    "Maximum Mechanical Temperature (°C)",
    "Melting Onset (°C)",
    "Melting Completion (°C)",
    "Specific Heat Capacity (J/(kg × °C))",
    "Thermal Conductivity (W/(m × °C))",
    "Thermal Expansion (%/°C)",
    "Heat Deflection (@66 PSI) (°C)",
    "Glass Transition Temperature (°C)",
  ],
};

export function ToggleableColumnTable({
  columns,
  getToggleHideAllColumnsProps,
}) {
  let jsx_map = {};
  columns.forEach(
    (column) =>
      (jsx_map[column.id] = (
        <div key={column.id}>
          <label>
            <input type="checkbox" {...column.getToggleHiddenProps()} />{" "}
            {column.id}
          </label>
        </div>
      ))
  );

  return (
    <table className="table is-narrow is-hoverable is-fullwidth">
      <tr>
        <th colSpan={3}>
          <IndeterminateCheckbox {...getToggleHideAllColumnsProps()} /> Toggle
          All
        </th>
      </tr>
      <tr>
        <th>Basic Properties</th>
        <th>Mechanical Properties</th>
        <th>Thermal Properties</th>
      </tr>
      {zip(groups["Basic"], groups["Mechanical"], groups["Thermal"]).map(
        ([b, m, t]) => (
          <tr key={b + m + t}>
            <td>{jsx_map[b]}</td>
            <td>{jsx_map[m]}</td>
            <td>{jsx_map[t]}</td>
          </tr>
        )
      )}
    </table>
  );
}

ToggleableColumnTable.propTypes = {
  columns: propTypes.array,
  getToggleHideAllColumnsProps: propTypes.func,
};
