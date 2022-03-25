import Graph from "common/components/graphing/Graph";
import { EzDataset, GraphConfig } from "common/components/graphing/graphConfig";
import Metadata from "common/components/Metadata";
import Table from "common/components/styling/Table";
import Compressor from "common/models/Compressor";
import Measurement from "common/models/Measurement";
import { useMemo } from "react";
import compressorsConfig, { graphConfig } from "web/info/compressors";

export default function CompressorsPage(): JSX.Element {
  const data: EzDataset[] = useMemo(
    () =>
      Compressor.getAllCompressors().map((c, i) =>
        GraphConfig.dataset(
          c.identifier,
          [...Array(120).keys()].map((n) => ({
            x: n,
            y: c.cfmAtPressure(new Measurement(n, "psi")).scalar,
          })),
          i,
          `y-${c.identifier}`
        )
      ),
    []
  );

  return (
    <>
      <Metadata pageConfig={compressorsConfig} />
      <Table
        columns={[
          {
            Header: "Name",
            accessor: "name",
          },
          {
            Header: "Weight (lbs)",
            accessor: "weight",
            sortType: "number",
          },
          {
            Header: "CFM @ 0 PSI",
            accessor: "cfm0",
            sortType: "number",
          },
          {
            Header: "CFM @ 50 PSI",
            accessor: "cfm50",
            sortType: "number",
          },
          {
            Header: "CFM @ 100 PSI",
            accessor: "cfm100",
            sortType: "number",
          },
          {
            Header: "CFM/lb @ 100 PSI",
            accessor: "cfmlb",
            sortType: "number",
          },
        ]}
        data={Compressor.getAllCompressors().map((c) => ({
          name: (
            <a target={"_blank"} href={c.url}>
              {c.identifier}
            </a>
          ),
          weight: c.weight.scalar.toFixed(2),
          cfm0: c.cfmAtPressure(new Measurement(0, "psi")).scalar.toFixed(2),
          cfm50: c.cfmAtPressure(new Measurement(50, "psi")).scalar.toFixed(2),
          cfm100: c
            .cfmAtPressure(new Measurement(100, "psi"))
            .scalar.toFixed(2),
          cfmlb: c
            .cfmAtPressure(new Measurement(100, "psi"))
            .div(c.weight)
            .scalar.toFixed(2),
        }))}
        fullwidth
        hoverable
      />

      <div className="playground-container">
        <Graph
          options={graphConfig}
          simpleDatasets={data}
          title="Compressor Data"
          id="compressorGraph"
        />
      </div>
    </>
  );
}
