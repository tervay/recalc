import Table from "common/components/styling/Table";
import { FRCVendor } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";

interface MountingPattern {
  vendor: FRCVendor;
  name: string;
  holeSize: Measurement;
  screwSize: string;
  mountingWidth: Measurement;
  mountingHeight: Measurement;
  fullWidth: Measurement;
  fullHeight: Measurement;
}

const data: MountingPattern[] = [
  {
    vendor: "CTRE",
    name: "Voltage Regulator Module",
    holeSize: new Measurement(0.15, "in"),
    screwSize: "#6, M3.5",
    mountingHeight: new Measurement(1.695, "in"),
    mountingWidth: new Measurement(1.88, "in"),
    fullHeight: new Measurement(2.03, "in"),
    fullWidth: new Measurement(2.22, "in"),
  },
  {
    vendor: "CTRE",
    name: "Power Distribution Panel",
    holeSize: new Measurement(0.21, "in"),
    screwSize: "#12, M5",
    mountingHeight: new Measurement(7.176, "in"),
    mountingWidth: new Measurement(4.11, "in"),
    fullHeight: new Measurement(7.586, "in"),
    fullWidth: new Measurement(4.748, "in"),
  },
  {
    vendor: "CTRE",
    name: "Pneumatics Control Module",
    holeSize: new Measurement(0.1445, "in"),
    screwSize: "#6, M3.5",
    mountingHeight: new Measurement(2.403, "in"),
    mountingWidth: new Measurement(1.923, "in"),
    fullHeight: new Measurement(2.72, "in"),
    fullWidth: new Measurement(2.24, "in"),
  },
  {
    vendor: "CTRE",
    name: "Pigeon 2.0",
    holeSize: new Measurement(0.1285, "in"),
    screwSize: "#5, M3",
    mountingHeight: new Measurement(1.14, "in"),
    mountingWidth: new Measurement(1.14, "in"),
    fullHeight: new Measurement(1.77, "in"),
    fullWidth: new Measurement(1.77, "in"),
  },
  {
    vendor: "REV",
    name: "Power Distribution Hub",
    holeSize: new Measurement(0.196, "in"),
    screwSize: "#10, M5",
    mountingHeight: new Measurement(8.5, "in"),
    mountingWidth: new Measurement(4, "in"),
    fullHeight: new Measurement(8.94, "in"),
    fullWidth: new Measurement(4.38, "in"),
  },
  {
    vendor: "REV",
    name: "Mini Power Module",
    holeSize: new Measurement(0.196, "in"),
    screwSize: "#10, M5",
    mountingHeight: new Measurement(3, "in"),
    mountingWidth: new Measurement(1.5, "in"),
    fullHeight: new Measurement(3.38, "in"),
    fullWidth: new Measurement(1.88, "in"),
  },
  {
    vendor: "REV",
    name: "Radio Power Module",
    holeSize: new Measurement(0.196, "in"),
    screwSize: "#10, M5",
    mountingHeight: new Measurement(3, "in"),
    mountingWidth: new Measurement(0, "in"),
    fullHeight: new Measurement(3.38, "in"),
    fullWidth: new Measurement(1.25, "in"),
  },
  {
    vendor: "REV",
    name: "Pneumatic Hub",
    holeSize: new Measurement(0.196, "in"),
    screwSize: "#10, M5",
    mountingHeight: new Measurement(4, "in"),
    mountingWidth: new Measurement(1.5, "in"),
    fullHeight: new Measurement(4.38, "in"),
    fullWidth: new Measurement(1.88, "in"),
  },
  {
    vendor: "AndyMark",
    name: "Main Breaker (Series 18X)",
    holeSize: new Measurement(0.26, "in"),
    screwSize: '1/4", M6',
    mountingHeight: new Measurement(2.23, "in"),
    mountingWidth: new Measurement(1.05, "in"),
    fullHeight: new Measurement(2.89, "in"),
    fullWidth: new Measurement(1.9, "in"),
  },
  {
    vendor: "Anderson Power",
    name: "SB50",
    holeSize: new Measurement(0.14, "in"),
    screwSize: "#6, M3.5",
    mountingHeight: new Measurement(0.75, "in"),
    mountingWidth: new Measurement(0, "in"),
    fullHeight: new Measurement(1.89, "in"),
    fullWidth: new Measurement(1.38, "in"),
  },
  {
    vendor: "Anderson Power",
    name: "SB120",
    holeSize: new Measurement(0.2, "in"),
    screwSize: "#10, M5",
    mountingHeight: new Measurement(0.75, "in"),
    mountingWidth: new Measurement(0, "in"),
    fullHeight: new Measurement(2.5, "in"),
    fullWidth: new Measurement(1.83, "in"),
  },
  {
    vendor: "NI",
    name: "roboRIO (bottom)",
    holeSize: new Measurement(0.112, "in"),
    screwSize: "#4",
    mountingHeight: new Measurement(5.0, "in"),
    mountingWidth: new Measurement(4.0, "in"),
    fullHeight: new Measurement(5.637, "in"),
    fullWidth: new Measurement(5.754, "in"),
  },
  {
    vendor: "NI",
    name: "roboRIO (top)",
    holeSize: new Measurement(0.112, "in"),
    screwSize: "#4",
    mountingHeight: new Measurement(0, "in"),
    mountingWidth: new Measurement(1.954, "in"),
    fullHeight: new Measurement(5.637, "in"),
    fullWidth: new Measurement(5.754, "in"),
  },
];

export default function MountingCheatSheet(): JSX.Element {
  return (
    <>
      <Table
        columns={[
          {
            Header: "Mounting Patterns",
            columns: [
              { Header: "Vendor", accessor: "vendor" },
              { Header: "Product", accessor: "product" },
              { Header: "Hole Size", accessor: "holeSize" },
              { Header: "Screw Size", accessor: "screwSize" },
              { Header: "Mounting Height", accessor: "mountingHeight" },
              { Header: "Mounting Width", accessor: "mountingWidth" },
              { Header: "Full Height", accessor: "fullHeight" },
              { Header: "Full Width", accessor: "fullWidth" },
            ],
          },
        ]}
        data={data.map((d) => ({
          vendor: d.vendor.toString(),
          product: d.name,
          holeSize: d.holeSize.format(),
          screwSize: d.screwSize,
          mountingHeight: d.mountingHeight.format(),
          mountingWidth: d.mountingWidth.format(),
          fullHeight: d.fullHeight.format(),
          fullWidth: d.fullWidth.format(),
        }))}
        fullwidth
        hoverable
        narrow
      />
    </>
  );
}
