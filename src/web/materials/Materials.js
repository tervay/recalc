import HeadingWithBgImage from "common/components/headings/HeadingWithBgImage";
import Metadata from "common/components/Metadata";
import Material from "common/models/Material";
import { uuid } from "common/tooling/util";
import propTypes from "prop-types";
import { useSortBy, useTable } from "react-table";

import config from "./index";
import { ToggleableColumnTable } from "./ToggleableColumnTable";

function Table({ columns, data }) {
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
      initialState: {
        hiddenColumns: [
          "Poisson's Ratio",
          "Brinell Hardness",
          "Rockwell M Hardness",
          "Fatigue Strength (MPa)",
          "Latent Heat of Fusion (J/g)",
          "Melting Completion (°C)",
          "Specific Heat Capacity (J/(kg × °C))",
          "Thermal Conductivity (W/(m × °C))",
          "Thermal Expansion (%/°C)",
          "Heat Deflection (@66 PSI) (°C)",
          "Glass Transition Temperature (°C)",
          "Shear Modulus (GPa)",
          "Shear Strength (MPa)",
          "Charpy Impact Strength (J/m^2)",
          "Tensile Strength (Yield) (MPa)",
          "Tensile Strength (Break) (MPa)",
          "Elongation At Break (%)",
          "Maximum Mechanical Temperature (°C)",
          "Melting Onset (°C)",
        ],
      },
    },
    useSortBy
  );

  return (
    <>
      <ToggleableColumnTable
        columns={allColumns}
        getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
      />
      <div className="table-container">
        <table
          {...getTableProps()}
          className="table is-narrow is-hoverable is-fullwidth is-bordered sticky"
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
            {rows.map((row) => {
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
          accessor: (m) => m.mechanical?.density?.to("g/cm3").scalar.toFixed(1),
        },
        {
          Header: "Brinell Hardness",
          accessor: (m) => m.mechanical?.brinellHardness,
        },
        {
          Header: "Rockwell M Hardness",
          accessor: (m) => m.mechanical?.rockwellMHardness,
        },
        {
          Header: "Tensile Modulus (GPa)",
          accessor: (m) =>
            m.mechanical?.tensileModulus?.to("GPa").scalar.toFixed(1),
        },
        {
          Header: "Elongation At Break (%)",
          accessor: (m) => m.mechanical?.elongationAtBreak,
        },
        {
          Header: "Fatigue Strength (MPa)",
          accessor: (m) =>
            m.mechanical?.fatigueStrength?.to("MPa").scalar.toFixed(1),
        },
        {
          Header: "Poisson's Ratio",
          accessor: (m) => m.mechanical?.poissonsRatio,
        },
        {
          Header: "Shear Modulus (GPa)",
          accessor: (m) =>
            m.mechanical?.shearModulus?.to("GPa").scalar.toFixed(1),
        },
        {
          Header: "Shear Strength (MPa)",
          accessor: (m) =>
            m.mechanical?.shearStrength?.to("MPa").scalar.toFixed(1),
        },
        {
          Header: "Tensile Strength (Yield) (MPa)",
          accessor: (m) =>
            m.mechanical?.tensileStrengthYield?.to("MPa").scalar.toFixed(1),
        },
        {
          Header: "Tensile Strength (Ultimate) (MPa)",
          accessor: (m) =>
            m.mechanical?.tensileStrengthUltimate?.to("MPa").scalar.toFixed(1),
        },
        {
          Header: "Tensile Strength (Break) (MPa)",
          accessor: (m) =>
            m.mechanical?.tensileStrengthBreak?.to("MPa").scalar.toFixed(1),
        },
        {
          Header: "Flexural Modulus (GPa)",
          accessor: (m) =>
            m.mechanical?.flexuralModulus?.to("GPa").scalar.toFixed(1),
        },
        {
          Header: "Flexural Strength (MPa)",
          accessor: (m) =>
            m.mechanical?.flexuralStrength?.to("MPa").scalar.toFixed(1),
        },
        {
          Header: "Izod Impact Strength (J/m)",
          accessor: (m) =>
            m.mechanical?.impactNotchedIzod?.to("J/m").scalar.toFixed(),
        },
        {
          Header: "Charpy Impact Strength (J/m^2)",
          accessor: (m) =>
            m.mechanical?.impactCharpy?.to("J/m^2").scalar.toFixed(),
        },
      ],
    },
    {
      Header: "Thermal",
      columns: [
        {
          Header: "Latent Heat of Fusion (J/g)",
          accessor: (m) =>
            m.thermal?.latentHeatOfFusion?.to("J/g").scalar.toFixed(0),
        },
        {
          Header: "Maximum Mechanical Temperature (°C)",
          accessor: (m) =>
            m.thermal?.maximumTemperatureMechanical
              ?.to("degC")
              .scalar.toFixed(0),
        },
        {
          Header: "Melting Onset (°C)",
          accessor: (m) =>
            m.thermal?.meltingOnset?.to("degC").scalar.toFixed(0),
        },
        {
          Header: "Melting Completion (°C)",
          accessor: (m) =>
            m.thermal?.meltingCompletion?.to("degC").scalar.toFixed(0),
        },
        {
          Header: "Specific Heat Capacity (J/(kg × °C))",
          accessor: (m) =>
            m.thermal?.specificHeatCapacity?.to("J/kg*degC").scalar.toFixed(1),
        },
        {
          Header: "Thermal Conductivity (W/(m × °C))",
          accessor: (m) =>
            m.thermal?.thermalConductivity?.to("W/m*degC").scalar.toFixed(1),
        },
        {
          Header: "Thermal Expansion (%/°C)",
          accessor: (m) =>
            m.thermal?.thermalExpansion
              ?.mul(100)
              .to("1/degC")
              .scalar.toFixed(4),
        },
        {
          Header: "Heat Deflection (@66 PSI) (°C)",
          accessor: (m) =>
            m.thermal?.heatDeflectionAt66Psi?.to("degC").scalar.toFixed(0),
        },
        {
          Header: "Glass Transition Temperature (°C)",
          accessor: (m) =>
            m.thermal?.glassTransitionTemperature?.to("degC").scalar.toFixed(0),
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
