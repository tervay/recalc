import { Title } from "common/components/styling/Building";
import Table from "common/components/styling/Table";
import Belt from "common/models/Belt";
import { useMemo } from "react";
import { Cell } from "react-table";

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
        columns={[
          {
            Header: "Teeth",
            accessor: "teeth",
          },
          {
            Header: "Pitch",
            accessor: "pitch",
          },
          {
            Header: "Length",
            accessor: "length",
          },
          {
            Header: "Width",
            accessor: "width",
          },
          {
            Header: "Vendor",
            accessor: "vendor",
          },
          {
            Header: "Type",
            accessor: "type",
          },
          {
            Header: "SKU",
            accessor: "sku",
          },
          {
            Header: "URL",
            accessor: "url",
            Cell: (cell: Cell) => <a href={cell.value}>{cell.value}</a>,
          },
        ]}
        data={data}
      />
    </>
  );
}
