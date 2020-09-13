import Table from "common/components/Table";
import Filament from "common/models/Filament";
import { setTitle } from "common/tooling/routing";
import React from "react";

import filamentConfig from "./index";

export default function Compressors() {
  setTitle(filamentConfig.title);

  const data = React.useMemo(
    () =>
      Filament.getAllFilaments().map((f) => ({
        name: f.name,
        material: f.material,
        density: f.density.to("g/cm3").scalar.toFixed(2),
        youngsModulus: f.youngsModulus.to("MPa").scalar.toFixed(0),
        tensileStrength: f.tensileStrength.to("MPa").scalar.toFixed(1),
        bendingStrength:
          f.bendingStrength === null
            ? ""
            : f.bendingStrength.to("MPa").scalar.toFixed(1),
        charpy: f.charpy.to("kJ/m2").scalar.toFixed(1),
        sources: f.sources.map((src, i) => (
          <a key={i} href={src}>
            [{i + 1}]
          </a>
        )),
      })),
    []
  );
  const columns = React.useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Material",
        accessor: "material",
      },
      {
        Header: "Density (g/m³)",
        accessor: "density",
      },
      {
        Header: "Young's Modulus (MPa)",
        accessor: "youngsModulus",
      },
      {
        Header: "Tensile Strength (MPa)",
        accessor: "tensileStrength",
      },
      {
        Header: "Flexural Strength (MPa)",
        accessor: "bendingStrength",
      },
      {
        Header: "Charpy impact strength (kJ/m²)",
        accessor: "charpy",
      },
      {
        Header: "Sources",
        accessor: "sources",
      },
    ],
    []
  );

  return (
    <>
      <Table columns={columns} data={data} />
      <section className="section">
        <div className="container">
          <div className="title">Explaining these numbers</div>
          <p>
            Imagine the printed part subject being a rectangular prism printed
            with filament lines in parallel with the long direction of the
            prism.
          </p>
          <br />
          <br />
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Young%27s_modulus"}>
              Young&apos;s Modulus
            </a>
          </div>
          <p>
            Essentially a measure of how stiff a material is. The higher the
            Young&apos;s Modulus, the stiffer the material is. See{" "}
            <a href={"https://www.youtube.com/watch?v=DLE-ieOVFjI"}>here</a>.
          </p>
          <br />
          <br />
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Ultimate_tensile_strength"}>
              Tensile Strength
            </a>
          </div>
          <p>
            The maximum stress that a material can withstand before it breaks.
          </p>
          <br />
          <br />
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Flexural_strength"}>
              Flexural Strength
            </a>
          </div>
          <p>
            How much stress a print can maintain before plastically deforming
            when attempting to bend the part the long way down the middle.
          </p>
          <br />
          <br />
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Charpy_impact_test"}>
              Charpy impact strength
            </a>
          </div>
          <p>
            How much energy is absorbed by the part when struck by a heavy
            pendulum.
          </p>
          <br />
          <br />
          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Deformation_(engineering)"}>
              Elastic vs Plastic Deformation
            </a>
          </div>
          <p>
            Imagine you are pulling on a rubber band. For the most part, the
            rubber band will return to its original shape after you release it.
            This is known as elastic deformation. However, if you pull on it too
            hard, it will break - and is then unable to return to its original
            shape. This is known as plastic deformation.
          </p>
        </div>
      </section>
    </>
  );
}
