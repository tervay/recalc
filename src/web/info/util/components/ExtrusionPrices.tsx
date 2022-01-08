/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Table from "common/components/styling/Table";
import _extrusion from "common/models/data/extrusion.json";
import Measurement from "common/models/Measurement";
import zip from "lodash/zip";

const extrusion: {
  materialType: string;
  size: string;
  length: Measurement;
  price: Measurement;
  vendor: string;
}[] = [];
Object.entries(_extrusion).forEach(([k, v_]) => {
  v_.forEach((v) => {
    zip(v.lengths, v.prices).map(([l, p]) => {
      extrusion.push({
        length: new Measurement(l!, "in"),
        materialType: k,
        price: new Measurement(p!, "USD"),
        vendor: v.vendor,
        size: v.size,
      });
    });
  });
});

export default function ExtrusionPrices(): JSX.Element {
  return (
    <>
      <Table
        columns={[
          {
            Header: "Extrusion Prices",
            columns: [
              {
                Header: "Material",
                accessor: "material",
              },
              {
                Header: "Size",
                accessor: "size",
              },
              {
                Header: "Vendor",
                accessor: "vendor",
              },
              {
                Header: "Length (in)",
                accessor: "length",
                className: "has-text-right",
              },
              {
                Header: "Price ($)",
                accessor: "price",
                className: "has-text-right",
              },
              {
                Header: "Dollars Per Inch",
                accessor: "pricePerLength",
                className: "has-text-right",
              },
            ],
          },
        ]}
        data={extrusion.map((e) => ({
          material: e.materialType,
          vendor: e.vendor,
          size: e.size,
          length: e.length.scalar,
          price: e.price.scalar.toFixed(2),
          pricePerLength: e.price.div(e.length).scalar.toFixed(2),
        }))}
        fullwidth
        hoverable
        narrow
      />
    </>
  );
}
