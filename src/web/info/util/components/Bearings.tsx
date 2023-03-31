import Table from "common/components/styling/Table";
import { inch, mm } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";

interface Bearing {
  vendor: "TTB" | "VEX" | "AndyMark" | "REV" | "WCP" | "Swyft";
  bore: "Hex" | "Round" | "Thunderhex";
  type: "Flanged" | "Radial";
  id: Measurement;
  od: Measurement;
  flangedOd?: Measurement;
  totalHeight: Measurement;
  flangeHeight?: Measurement;
  url: string;
}

const bearings: Bearing[] = [
  {
    vendor: "TTB",
    bore: "Round",
    type: "Flanged",
    id: mm(13.75),
    od: inch(0.75),
    flangedOd: inch(0.875),
    totalHeight: inch(0.375),
    flangeHeight: inch(0.125),
    url: "https://www.thethriftybot.com/bearings/QTY-10-The-Thrifty-Bushing-p149015039",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Radial",
    id: inch(0.25),
    od: inch(0.75),
    totalHeight: inch(0.28),
    url: "https://www.thethriftybot.com/bearings/QTY-10-75-OD-x-25-ID-x-280-Wide-Radial-Ball-Bearing-p350673484",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Radial",
    id: inch(0.25),
    od: inch(0.5),
    totalHeight: inch(0.188),
    url: "https://www.thethriftybot.com/bearings/QTY-10-50-OD-x-25-ID-x-188-Wide-Round-Radial-Bearing-p210329661",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Radial",
    id: inch(0.25),
    od: inch(0.375),
    totalHeight: inch(0.125),
    url: "https://www.thethriftybot.com/bearings/QTY-10-375-OD-x-25-ID-x-125-Wide-Radial-Bearing-p197170776",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Radial",
    id: inch(0.375),
    od: inch(0.875),
    totalHeight: inch(0.28),
    url: "https://www.thethriftybot.com/bearings/QTY-10-875-OD-x-375-ID-x-280-Wide-Radial-Bearing-p197184747",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Radial",
    id: inch(0.375),
    od: inch(1.125),
    totalHeight: inch(0.375),
    url: "https://www.thethriftybot.com/bearings/QTY-10-1-125-OD-x-375-ID-x-375-Wide-Radial-Bearing-p197213548",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Radial",
    id: inch(0.5),
    od: inch(1.125),
    totalHeight: inch(0.3125),
    url: "https://www.thethriftybot.com/bearings/QTY-10-1-125-OD-x-50-ID-x-313-Wide-Radial-Bearing-p198335515",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Flanged",
    id: mm(10.25),
    od: inch(0.875),
    flangedOd: inch(0.9675),
    totalHeight: inch(0.28),
    flangeHeight: inch(1 / 16),
    url: "https://www.thethriftybot.com/bearings/QTY-10-Flanged-10-25mm-Round-Ball-Bearings-p247658643",
  },
  {
    vendor: "TTB",
    bore: "Hex",
    type: "Flanged",
    id: inch(0.5),
    od: inch(1.125),
    flangedOd: inch(1.225),
    totalHeight: inch(0.3125),
    flangeHeight: inch(1 / 16),
    url: "https://www.thethriftybot.com/bearings/QTY-10-Flanged-1-2-Inch-Hex-Ball-Bearings-p145332373",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Flanged",
    id: mm(13.75),
    od: inch(1.125),
    flangedOd: inch(1.225),
    totalHeight: inch(0.314),
    flangeHeight: inch(1 / 16),
    url: "https://www.thethriftybot.com/bearings/QTY-10-Flanged-13-75mm-Round-Ball-Bearings-p163338648",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Flanged",
    id: mm(8),
    od: mm(16),
    flangedOd: mm(18),
    totalHeight: mm(5),
    flangeHeight: mm(1.3),
    url: "https://www.thethriftybot.com/bearings/QTY-5-8mm-x-16mm-x-5mm-Flanged-Round-Bearing-p155615798",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Flanged",
    id: inch(0.375),
    od: inch(0.875),
    flangedOd: inch(0.9675),
    totalHeight: inch(0.28),
    flangeHeight: inch(1 / 16),
    url: "https://www.thethriftybot.com/bearings/QTY-10-875-OD-x-375-ID-x-280-Wide-Flanged-Round-Bearing-p155615805",
  },
  {
    vendor: "TTB",
    bore: "Round",
    type: "Flanged",
    id: inch(0.5),
    od: inch(1.125),
    flangedOd: inch(1.225),
    totalHeight: inch(0.3125),
    flangeHeight: inch(1 / 16),
    url: "https://www.thethriftybot.com/bearings/QTY-10-1-125-OD-x-50-ID-x-313-Wide-Flanged-Round-Bearing-p198335524",
  },
];

export default function Bearings(): JSX.Element {
  return (
    <>
      <Table
        columns={[
          {
            Header: "Bearings",
            columns: [
              { Header: "Link", accessor: "link" },
              { Header: "Bore", accessor: "bore" },
              { Header: "Type", accessor: "type" },
              { Header: "ID", accessor: "id" },
              { Header: "OD", accessor: "od" },
              { Header: "Flanged OD", accessor: "flangedOd" },
              { Header: "Total Height", accessor: "totalHeight" },
              { Header: "Flange Height", accessor: "flangeHeight" },
              { Header: "Flangeless Height", accessor: "flangelessHeight" },
            ],
          },
        ]}
        data={bearings.map((b) => ({
          link: <a href={b.url}>{b.vendor}</a>,
          bore: b.bore,
          type: b.type,
          id: b.id.format(),
          od: b.od.format(),
          flangedOd: b.flangedOd?.format(),
          totalHeight: b.totalHeight.format(),
          flangeHeight: b.flangeHeight?.format(),
          flangelessHeight: (b.flangeHeight === undefined
            ? b.totalHeight
            : b.totalHeight.sub(b.flangeHeight)
          )
            .round(4)
            .format(),
        }))}
        fullwidth
        hoverable
        narrow
      />
    </>
  );
}
