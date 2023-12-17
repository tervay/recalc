import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { MeasurementInput } from "common/components/io/new/inputs";
import { Column, Columns } from "common/components/styling/Building";
import Table from "common/components/styling/Table";
import { inch, mm } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import { useEffect, useState } from "react";

interface HoleSizeInfo {
  size: string;
  tapped?: Measurement;
  close: Measurement;
}

type ImperialHoleSize = HoleSizeInfo & {
  free: Measurement;
};

type MetricHoleSize = HoleSizeInfo & {
  normal: Measurement;
  loose: Measurement;
};

const imperial: ImperialHoleSize[] = [
  {
    size: "1/4-20",
    tapped: inch(0.201),
    close: inch(0.257),
    free: inch(0.266),
  },
  { size: "#12", close: inch(0.221), free: inch(0.228) },
  {
    size: "#10-32",
    tapped: inch(0.159),
    close: inch(0.196),
    free: inch(0.201),
  },
  { size: "#8-32", tapped: inch(0.136), close: inch(0.17), free: inch(0.177) },
  { size: "#6-32", tapped: inch(0.107), close: inch(0.144), free: inch(0.15) },
  { size: "#5-40", tapped: inch(0.102), close: inch(0.129), free: inch(0.136) },
  { size: "#4-40", tapped: inch(0.089), close: inch(0.116), free: inch(0.129) },
  { size: "#3", close: inch(0.104), free: inch(0.11) },
  { size: "#2-56", tapped: inch(0.07), close: inch(0.089), free: inch(0.096) },
  { size: "#1", close: inch(0.076), free: inch(0.081) },
  { size: "#0-80", tapped: inch(0.047), close: inch(0.064), free: inch(0.07) },
];

const metric: MetricHoleSize[] = [
  {
    size: "M10-1.5",
    tapped: mm(8.5),
    close: mm(10.5),
    normal: mm(11),
    loose: mm(12),
  },
  {
    size: "M8-1.25",
    tapped: mm(6.8),
    close: mm(8.4),
    normal: mm(9),
    loose: mm(10),
  },
  {
    size: "M6-1",
    tapped: mm(5),
    close: mm(6.4),
    normal: mm(6.6),
    loose: mm(7),
  },
  {
    size: "M5-0.8",
    tapped: mm(4.2),
    close: mm(5.3),
    normal: mm(5.5),
    loose: mm(5.8),
  },
  {
    size: "M4-0.7",
    tapped: mm(3.3),
    close: mm(4.3),
    normal: mm(4.5),
    loose: mm(4.8),
  },
  {
    size: "M3-0.5",
    tapped: mm(2.5),
    close: mm(3.2),
    normal: mm(3.4),
    loose: mm(3.6),
  },
  {
    size: "M2.5-0.45",
    tapped: mm(2.05),
    close: mm(2.7),
    normal: mm(2.9),
    loose: mm(3.1),
  },
  {
    size: "M2-0.4",
    tapped: mm(1.6),
    close: mm(2.2),
    normal: mm(2.4),
    loose: mm(2.6),
  },
  {
    size: "M1.6-0.35",
    tapped: mm(1.25),
    close: mm(1.7),
    normal: mm(1.8),
    loose: mm(2.0),
  },
  {
    size: "M1.4-0.3",
    tapped: mm(1.1),
    close: mm(1.5),
    normal: mm(1.6),
    loose: mm(1.8),
  },
  {
    size: "M1.2-0.25",
    tapped: mm(0.95),
    close: mm(1.3),
    normal: mm(1.4),
    loose: mm(1.5),
  },
  {
    size: "M1-0.25",
    tapped: mm(0.75),
    close: mm(1.1),
    normal: mm(1.2),
    loose: mm(1.3),
  },
];

function cellStyle(
  cellString: string,
  greenHighlights: Measurement[],
  yellowHighlights: Measurement[],
  boltHighlights: string[],
): string {
  //   console.log(cellString, boltHighlights);
  if (boltHighlights.includes(cellString)) {
    return "has-background-success";
  }

  if (cellString === "-" || !cellString.includes(" ")) {
    return "";
  }

  const [val, unit] = cellString.split(" ");
  const measurement = new Measurement(Number(val), unit);
  if (greenHighlights.map((gh) => gh.eq(measurement)).includes(true)) {
    return "has-background-success";
  }
  if (yellowHighlights.map((gh) => gh.eq(measurement)).includes(true)) {
    return "has-background-warning";
  }

  return "";
}

export function HoleSizes(): JSX.Element {
  const [inputHoleSize, setInputHoleSize] = useState(
    new Measurement(0.19, "inch"),
  );

  const [greenHighlight, setGreenHighlight] = useState([] as Measurement[]);
  const [yellowHighlight, setYellowHighlight] = useState([] as Measurement[]);
  const [boltHighlight, setBoltHighlight] = useState([] as string[]);

  const cellStyleHelper = ({
    cell,
  }: {
    cell: { value: string | undefined };
  }) => {
    return (
      <div
        className={cellStyle(
          cell.value ?? "",
          greenHighlight,
          yellowHighlight,
          boltHighlight,
        )}
      >
        {cell.value}
      </div>
    );
  };

  useEffect(() => {
    const newGreenHighlights: Measurement[] = [],
      newYellowHighlights: Measurement[] = [],
      newBoltHighlights: string[] = [];

    imperial
      .map((hsi) => ({ size: hsi.size, holes: [hsi.close, hsi.free] }))
      .filter((hsi) => hsi.holes.every((hole) => hole.lte(inputHoleSize)))
      .flatMap((hsi) => hsi.holes.map((h) => ({ size: hsi.size, hole: h })))
      .sort((a, b) => {
        const aDiff = a.hole.sub(inputHoleSize).abs();
        const bDiff = b.hole.sub(inputHoleSize).abs();
        return aDiff.sub(bDiff).baseScalar;
      })
      .reduce(
        (
          result: {
            size: string;
            hole: Measurement;
          }[],
          combo,
        ) => {
          if (!result.some((c) => c.size === combo.size)) {
            result.push(combo);
          }
          return result;
        },
        [],
      )
      .forEach((m, i) => {
        if (i === 0) {
          newBoltHighlights.push(m.size);
        }
      });

    imperial
      .flatMap((holeSize) => [
        ...(holeSize.tapped ? [holeSize.tapped] : []),
        holeSize.close,
        holeSize.free,
      ])
      .sort((a, b) => {
        const aDiff = a.sub(inputHoleSize).abs();
        const bDiff = b.sub(inputHoleSize).abs();
        return aDiff.sub(bDiff).baseScalar;
      })
      .forEach((m, i) => {
        if (i === 0) {
          newGreenHighlights.push(m);
        } else if (i <= 3) {
          newYellowHighlights.push(m);
        }
      });

    metric
      .map((hsi) => ({
        size: hsi.size,
        holes: [hsi.close, hsi.normal, hsi.loose],
      }))
      .filter((hsi) => hsi.holes.every((hole) => hole.lte(inputHoleSize)))
      .flatMap((hsi) => hsi.holes.map((h) => ({ size: hsi.size, hole: h })))
      .sort((a, b) => {
        const aDiff = a.hole.sub(inputHoleSize).abs();
        const bDiff = b.hole.sub(inputHoleSize).abs();
        return aDiff.sub(bDiff).baseScalar;
      })
      .reduce(
        (
          result: {
            size: string;
            hole: Measurement;
          }[],
          combo,
        ) => {
          if (!result.some((c) => c.size === combo.size)) {
            result.push(combo);
          }
          return result;
        },
        [],
      )
      .forEach((m, i) => {
        if (i === 0) {
          newBoltHighlights.push(m.size);
        }
      });

    metric
      .flatMap((holeSize) => [
        ...(holeSize.tapped ? [holeSize.tapped] : []),
        holeSize.close,
        holeSize.normal,
        holeSize.loose,
      ])
      .sort((a, b) => {
        const aDiff = a.sub(inputHoleSize).abs();
        const bDiff = b.sub(inputHoleSize).abs();
        return aDiff.sub(bDiff).baseScalar;
      })
      .forEach((m, i) => {
        if (i === 0) {
          newGreenHighlights.push(m);
        } else if (i <= 3) {
          newYellowHighlights.push(m);
        }
      });

    setGreenHighlight(newGreenHighlights);
    setYellowHighlight(newYellowHighlights);
    setBoltHighlight(newBoltHighlights);
  }, [inputHoleSize]);

  return (
    <>
      <div className="is-size-3">Hole Sizes</div>
      <Columns formColumns>
        <Column>
          <SingleInputLine label="Hole Size">
            <MeasurementInput stateHook={[inputHoleSize, setInputHoleSize]} />
          </SingleInputLine>
        </Column>
        <Column>
          Green bolt sizes are the largest bolt that will fit in the input hole
          size. Green hole sizes are the closest hole sizes to the input hole
          size. Yellow are the next 3 closest.
        </Column>
      </Columns>
      <Columns>
        <Column>
          <Table
            columns={[
              {
                Header: "Imperial",
                columns: [
                  { Header: "Size", accessor: "size", Cell: cellStyleHelper },
                  {
                    Header: "Tapped",
                    accessor: "tapped",
                    Cell: cellStyleHelper,
                  },
                  { Header: "Close", accessor: "close", Cell: cellStyleHelper },
                  { Header: "Free", accessor: "free", Cell: cellStyleHelper },
                ],
              },
            ]}
            data={imperial.map((hsi) => ({
              size: hsi.size,
              tapped: hsi.tapped === undefined ? "-" : hsi.tapped.format(),
              close: hsi.close.format(),
              free: hsi.free.format(),
            }))}
            fullwidth
            hoverable
            narrow
          />
        </Column>
        <Column>
          <Table
            columns={[
              {
                Header: "Metric",
                columns: [
                  { Header: "Size", accessor: "size", Cell: cellStyleHelper },
                  {
                    Header: "Tapped",
                    accessor: "tapped",
                    Cell: cellStyleHelper,
                  },
                  { Header: "Close", accessor: "close", Cell: cellStyleHelper },
                  {
                    Header: "Normal",
                    accessor: "normal",
                    Cell: cellStyleHelper,
                  },
                  { Header: "Loose", accessor: "loose", Cell: cellStyleHelper },
                ],
              },
            ]}
            data={metric.map((hsi) => ({
              size: hsi.size,
              tapped: hsi.tapped === undefined ? "-" : hsi.tapped.format(),
              close: hsi.close.format(),
              normal: hsi.normal.format(),
              loose: hsi.loose.format(),
            }))}
            fullwidth
            hoverable
            narrow
          />
        </Column>
      </Columns>
    </>
  );
}
