import HeadingWithBgImage from "common/components/headings/HeadingWithBgImage";
import Metadata from "common/components/Metadata";
import Table from "common/components/Table";
import Filament from "common/models/Filament";
import { useMemo } from "react";

import config from "./index";

export default function Compressors() {
  const data = useMemo(
    () =>
      Filament.getAllFilaments().map((f) => ({
        name: f.name,
        material: f.material,
        density: f.density.scalar.toFixed(2),
        youngsModulus: f.youngsModulus.to("MPa").scalar.toFixed(0),
        tensileStrength: f.tensileStrength.to("MPa").scalar.toFixed(1),
        bendingStrength:
          f.bendingStrength === null
            ? ""
            : f.bendingStrength.to("MPa").scalar.toFixed(1),
        charpy: f.charpy === null ? "" : f.charpy.to("kJ/m2").scalar.toFixed(1),
        sources: f.sources.map((src, i) => (
          <a key={i} href={src}>
            [{i + 1}]
          </a>
        )),
      })),
    []
  );
  const columns = useMemo(
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
      <Metadata config={config} />
      <HeadingWithBgImage title={config.title} image={config.image} />
      <Table columns={columns} data={data} />
      <section className="section">
        <div className="container">
          <div className="title">Explaining these numbers</div>
          <p className={"block"}>
            Imagine the printed part subject being a rectangular prism printed
            with filament lines in parallel with the long direction of the
            prism.
          </p>

          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Young%27s_modulus"}>
              Young&apos;s Modulus
            </a>
          </div>
          <p className={"block"}>
            Essentially a measure of how stiff a material is. The higher the
            Young&apos;s Modulus, the stiffer the material is. See{" "}
            <a href={"https://www.youtube.com/watch?v=DLE-ieOVFjI"}>here</a>.
          </p>

          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Ultimate_tensile_strength"}>
              Tensile Strength
            </a>
          </div>
          <p className={"block"}>
            The maximum stress that a material can withstand before it breaks.
          </p>

          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Flexural_strength"}>
              Flexural Strength
            </a>
          </div>
          <p className={"block"}>
            How much stress a print can maintain before plastically deforming
            when attempting to bend the part the long way down the middle.
          </p>

          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Charpy_impact_test"}>
              Charpy impact strength
            </a>
          </div>
          <p className={"block"}>
            How much energy is absorbed by the part when struck by a heavy
            pendulum.
          </p>

          <div className="title">
            <a href={"https://en.wikipedia.org/wiki/Deformation_(engineering)"}>
              Elastic vs Plastic Deformation
            </a>
          </div>
          <p className={"block"}>
            Imagine you are pulling on a rubber band. For the most part, the
            rubber band will return to its original shape after you release it.
            This is known as elastic deformation.
          </p>
          <p className={"block"}>
            Now suppose you pull a bit harder. It doesn&apos;t break, but you
            stretch it far enough such that it doesn&apos;t return to its
            original state, and is now permanently deformed. This is known as
            plastic deformation.
          </p>
          <p className={"block"}>
            Suppose you pull even harder. Now, the rubber band snaps. This is
            known as a <i>fracture.</i>
          </p>
        </div>
      </section>
    </>
  );
}
