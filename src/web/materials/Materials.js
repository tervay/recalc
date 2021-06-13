import HeadingWithBgImage from "common/components/headings/HeadingWithBgImage";
import Metadata from "common/components/Metadata";
import Filament from "common/models/Filament";
import Material from "common/models/Material";
import { useMemo, useEffect, useRef, forwardRef } from "react";
import { useTable, useSortBy } from "react-table";
import propTypes from "prop-types";

import config from "./index";
import { uuid } from "common/tooling/util";

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

function formatMeasurement(measurement, units, scalarToFixed) {
  if (measurement !== undefined && measurement !== null) {
    return measurement.to(units).scalar.toFixed(scalarToFixed);
  }

  return "";
}

function formatNumber(number, scalarToFixed) {
  if (number !== undefined && number !== null) {
    if (scalarToFixed !== undefined) {
      return number.toFixed(scalarToFixed);
    }

    return number;
  }

  return "";
}

function Table({ columns, data }) {
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    allColumns,
    getToggleHideAllColumnsProps,
  } = useTable(
    {
      columns,
      data,
    },
    useSortBy
  );

  return (
    <>
      <div>
        <div>
          <IndeterminateCheckbox {...getToggleHideAllColumnsProps()} /> Toggle
          All
        </div>
        {allColumns.map((column) => (
          <div key={column.id}>
            <label>
              <input type="checkbox" {...column.getToggleHiddenProps()} />{" "}
              {column.id}
            </label>
          </div>
        ))}
        <br />
      </div>
      <div className="table-container">
        <table
          {...getTableProps()}
          className="table is-narrow is-hoverable is-fullwidth"
        >
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={uuid()}>
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    key={uuid()}
                    className="has-text-centered"
                  >
                    {column.render("Header")}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? " 🠗"
                          : " 🠕"
                        : ""}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row, i) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={uuid()}>
                  {row.cells.map((cell) => {
                    return (
                      <td
                        {...cell.getCellProps()}
                        key={uuid()}
                        className="has-text-centered"
                      >
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

Table.propTypes = {
  columns: propTypes.any,
  data: propTypes.any,
};

export default function Materials() {
  const columns = [
    {
      Header: "Material",
      columns: [
        {
          Header: "Material",
          accessor: (m) => m.material,
        },
        {
          Header: "Name",
          accessor: (m) => m.name,
        },
      ],
    },
    {
      Header: "Mechanical",
      columns: [
        {
          Header: "Density (g/cm³)",
          // accessor: (m) => m.mechanical.density.to("g/cm3").scalar.toFixed(2),
          accessor: (m) => formatMeasurement(m.mechanical.density, "g/cm3", 2),
        },
        {
          Header: "Hardness",
          accessor: (m) => formatNumber(m.mechanical.hardness),
        },
        {
          Header: "Tensile Modulus (GPa)",
          accessor: (m) =>
            formatMeasurement(m.mechanical.tensileModulus, "GPa", 0),
        },
        {
          Header: "Elongation At Break (%)",
          accessor: (m) => formatNumber(m.mechanical.elongationAtBreak),
        },
        {
          Header: "Fatigue Strength (MPa)",
          accessor: (m) =>
            formatMeasurement(m.mechanical.fatigueStrength, "MPa", 0),
        },
        {
          Header: "Poisson's Ratio",
          accessor: (m) => formatNumber(m.mechanical.poissonsRatio),
        },
        {
          Header: "Shear Modulus (GPa)",
          accessor: (m) =>
            formatMeasurement(m.mechanical.shearModulus, "GPa", 0),
        },
        {
          Header: "Shear Strength (MPa)",
          accessor: (m) =>
            formatMeasurement(m.mechanical.shearStrength, "MPa", 0),
        },
        {
          Header: "Tensile Strength (Ultimate) (MPa)",
          accessor: (m) =>
            formatMeasurement(m.mechanical.tensileStrengthUltimate, "MPa", 0),
        },
        {
          Header: "Tensile Strength (Yield) (MPa)",
          accessor: (m) =>
            formatMeasurement(m.mechanical.tensileStrengthYield, "MPa", 0),
        },
      ],
    },
    {
      Header: "Thermal",
      columns: [
        {
          Header: "Latent Heat of Fusion (J/g)",
          accessor: (m) =>
            formatMeasurement(m.thermal?.latentHeatOfFusion, "J/g", 0),
        },
        {
          Header: "Maximum Mechanical Temperature (°C)",
          accessor: (m) =>
            formatMeasurement(
              m.thermal?.maximumTemperatureMechanical,
              "degC",
              0
            ),
        },
        {
          Header: "Melting Onset (°C)",
          accessor: (m) =>
            formatMeasurement(m.thermal?.meltingOnset, "degC", 0),
        },
        {
          Header: "Melting Completion (°C)",
          accessor: (m) =>
            formatMeasurement(m.thermal?.meltingCompletion, "degC", 0),
        },
        {
          Header: "Specific Heat Capacity (J/(kg × °C))",
          accessor: (m) =>
            formatMeasurement(m.thermal?.specificHeatCapacity, "J/kg*degC", 0),
        },
        {
          Header: "Thermal Conductivity (W/(m × °C))",
          accessor: (m) =>
            formatMeasurement(m.thermal?.thermalConductivity, "W/m*degC", 0),
        },
        {
          Header: "Thermal Expansion (%/°C)",
          accessor: (m) =>
            formatMeasurement(
              m.thermal?.thermalExpansion.mul(100),
              "1/degC",
              4
            ),
        },
      ],
    },
  ];

  const data = Material.getAllMaterials();

  return (
    <>
      <Metadata config={config} />
      <HeadingWithBgImage title={config.title} image={config.image} />
      <Table columns={columns} data={data} />
    </>
  );
}
