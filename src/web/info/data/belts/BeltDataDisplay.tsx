import { Title } from "common/components/styling/Building";
import Table from "common/components/styling/Table";
import Belt from "common/models/Belt";
import { useMemo } from "react";
import { CellProps, Column } from "react-table";

interface Thing {
  teeth: string | number;
  pitch: string;
  length: string;
  width?: string;
  vendor?: string;
  type?: string;
  sku?: string;
  url?: string;
}

export default function BeltDataDisplay(): JSX.Element {
  const data = useMemo(
    () =>
      Belt.getAllBelts(true).map((b) => ({
        teeth: b.teeth,
        pitch: b.pitch.format(),
        length: b.length.format(),
        width: b.width?.format(),
        vendor: b.vendor,
        type: b.type,
        sku: b.sku,
        url: b.url,
      })),
    []
  );

  return (
    <>
      <Title>All {data.length} belts</Title>
      <Table
        fullwidth
        hoverable
        paginated
        narrow
        columns={
          [
            {
              Header: "Teeth",
              accessor: "teeth" as keyof Thing,
            },
            {
              Header: "Pitch",
              accessor: "pitch" as keyof Thing,
            },
            {
              Header: "Length",
              accessor: "length" as keyof Thing,
            },
            {
              Header: "Width",
              accessor: "width" as keyof Thing,
            },
            {
              Header: "Vendor",
              accessor: "vendor" as keyof Thing,
            },
            {
              Header: "Type",
              accessor: "type" as keyof Thing,
            },
            {
              Header: "SKU",
              accessor: "sku" as keyof Thing,
            },
            {
              Header: "URL",
              accessor: "url" as keyof Thing,
              Cell: ({ value }: CellProps<Thing>) => (
                <a href={value} target={"_blank"}>
                  {value}
                </a>
              ),
            },
          ] as Column<Thing>[]
        }
        data={data}
      />
    </>
  );
}
