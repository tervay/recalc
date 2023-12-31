import Table from "common/components/styling/Table";
import { Bore } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import bearingData from "common/models/data/bearings.json";
import { useMemo } from "react";

interface ProcessedBearing {
  partNumber: string;
  url: string;
  id: Measurement;
  od: Measurement;
  bore: Bore;
  flangeOD?: Measurement;
  flangeWidth?: Measurement;
  overallWidth: Measurement;
}

function getBearingData(): ProcessedBearing[] {
  const getMeasurementFromNumOrStr = (
    x: number | string,
  ): Measurement | undefined => {
    if (String(x) == "-") {
      return undefined;
    }

    if (String(x).includes("mm")) {
      return new Measurement(Number(String(x).replace("mm", "")), "mm");
    }

    return new Measurement(Number(x), "in");
  };

  return bearingData.map((b) => {
    return {
      bore: b.Bore as Bore,
      partNumber: b.PN,
      url: b.Link,
      id: getMeasurementFromNumOrStr(b.ID)!,
      od: getMeasurementFromNumOrStr(b.OD)!,
      flangeOD: getMeasurementFromNumOrStr(b["Flange OD"]),
      flangeWidth: getMeasurementFromNumOrStr(b["Flange Width"]),
      overallWidth: getMeasurementFromNumOrStr(b["Overall Width"])!,
    };
  });
}

export default function Bearings(): JSX.Element {
  const data = useMemo(() => getBearingData(), []);

  return (
    <>
      <Table
        columns={[
          {
            Header: "Bearings",
            columns: [
              { Header: "Link", accessor: "link" },
              { Header: "Bore", accessor: "bore" },
              { Header: "ID", accessor: "id" },
              { Header: "OD", accessor: "od" },
              { Header: "Flanged OD", accessor: "flangedOd" },
              { Header: "Total Height", accessor: "totalHeight" },
              { Header: "Flange Height", accessor: "flangeHeight" },
              { Header: "Flangeless Height", accessor: "flangelessHeight" },
            ],
          },
        ]}
        data={data.map((b) => ({
          link: <a href={b.url}>{b.partNumber}</a>,
          bore: b.bore,
          id: b.id.format(),
          od: b.od.format(),
          flangedOd: b.flangeOD?.format(),
          totalHeight: b.overallWidth.format(),
          flangeHeight: b.flangeWidth?.format(),
          flangelessHeight: (b.flangeWidth === undefined
            ? b.overallWidth
            : b.overallWidth.sub(b.flangeWidth)
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
