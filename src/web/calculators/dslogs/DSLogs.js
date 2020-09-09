import { ChartBuilder, YAxisBuilder } from "common/tooling/charts";
import { Line } from "lib/react-chart-js";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

import { DSLogParser } from "./parser";

export default function DSLogs() {
  const [records, setRecords] = useState([]);
  const [displayedRecords, setDisplayedRecords] = useState(records);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  const [chartData, setChartData] = useState(ChartBuilder.defaultData());
  const [chartOptions, setChartOptions] = useState(
    ChartBuilder.defaultOptions()
  );

  useEffect(() => {
    setDisplayedRecords(records.slice(start, end));
    if (displayedRecords.length === 0) {
      return;
    }

    console.log({ displayedRecords });
    const startTime = moment(displayedRecords[0].time);

    const cb = new ChartBuilder()
      .setTitle("Title")
      .setXTitle("X")
      .setMaintainAspectRatio(true)
      .setResponsive(true)
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("Voltage")
          .setDisplayAxis(true)
          .setDraw(true)
          .setColor(YAxisBuilder.chartColor(0))
          .setData(
            displayedRecords.map((r) => ({
              x: moment(r.time).diff(startTime, "s"),
              y: r.voltage,
            }))
          )
          .setPosition("left")
      )
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("PDP Voltage")
          .setColor(YAxisBuilder.chartColor(1))
          .setData(
            displayedRecords.map((r) => ({
              x: moment(r.time).diff(startTime, "s"),
              y: r.pdpVoltage,
            }))
          )
          .setDisplayAxis(true)
          .setDraw(false)
          .setPosition("right")
      );

    console.log(cb._yBuilders);

    setChartOptions(cb.buildOptions());
    setChartData(cb.buildData());
  }, [start, end, JSON.stringify(displayedRecords)]);
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result;
        // console.log(binaryStr);
        const parser = new DSLogParser(binaryStr);
        setRecords(parser.readRecords());
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <>
      <div>
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <p>Drag n drop some files here, or click to select files</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input
            type="number"
            name={"start"}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            type="number"
            name={"end"}
            onChange={(e) => setEnd(e.target.value)}
          />
          <button className={"button"} type={"submit"}>
            Submit
          </button>
        </form>
      </div>
      <div>
        <div>{records.length} records parsed</div>
        <Line data={chartData} options={chartOptions} />
      </div>
    </>
  );
}
