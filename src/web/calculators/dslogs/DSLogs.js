import { LabeledPatientNumberInput } from "common/components/io/inputs/PatientNumberInput";
import { ChartBuilder, YAxisBuilder } from "common/tooling/charts";
import { Line } from "lib/react-chart-js";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { decimate } from "web/calculators/dslogs/dataUtils";
import { DSLogParser } from "web/calculators/dslogs/parser";

export default function DSLogs() {
  const [records, setRecords] = useState([]);
  const [displayedRecords, setDisplayedRecords] = useState(records);
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(5);
  const [precision, setPrecision] = useState(1);

  const [errors, setErrors] = useState([]);
  const [filename, setFilename] = useState("example.dslog");
  const [chartData, setChartData] = useState(ChartBuilder.defaultData());
  const [chartOptions, setChartOptions] = useState(
    ChartBuilder.defaultOptions()
  );

  useEffect(() => {
    setDisplayedRecords(records.slice(start, end));
    if (displayedRecords.length === 0) {
      return;
    }

    const cb = new ChartBuilder()
      .setPerformanceModeOn(true)
      .setTitle("Title")
      .setXTitle("X")
      .setXAxisType("time")
      .setMaintainAspectRatio(true)
      .setResponsive(true)
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("Voltage")
          .setDisplayAxis(true)
          .setDraw(true)
          .setColor(YAxisBuilder.chartColor(0))
          .setData(
            decimate(
              displayedRecords.map((r) => ({
                x: moment(r.time).toDate(),
                y: r.voltage,
              })),
              precision
            )
          )
          .setPosition("left")
      )
      .addYBuilder(
        new YAxisBuilder()
          .setTitleAndId("PDP Voltage")
          .setColor(YAxisBuilder.chartColor(1))
          .setData(
            decimate(
              displayedRecords.map((r) => ({
                x: moment(r.time).toDate(),
                y: r.pdpVoltage,
              })),
              precision
            )
          )
          .setDisplayAxis(true)
          .setDraw(false)
          .setPosition("right")
      );

    setChartOptions(cb.buildOptions());
    setChartData(cb.buildData());
  }, [start, end, JSON.stringify(displayedRecords), precision, filename]);

  // File input
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length >= 2) {
      setErrors(errors.concat(["Please only upload a single file :)"]));
    }

    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onabort = () => {
        setErrors(errors.concat([`Aborted reading file - ${file.name}`]));
      };
      reader.onerror = () => {
        setErrors(errors.concat([`Failed reading file - ${file.name}`]));
      };
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result;
        const parser = new DSLogParser(binaryStr);
        setRecords(parser.readRecords());
        setFilename(file.name);
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);
  const { getInputProps, fileRejections } = useDropzone({
    onDrop,
    accept: ".dslog",
  });

  return (
    <>
      <div>
        {errors.map((e) => {
          return <div key={e}>{e}</div>;
        })}
        {fileRejections.map((f) => {
          return <div key={f.file.name}>{f.errors[0].message}</div>;
        })}

        <div className="field file has-name is-fullwidth">
          <label className="file-label">
            <input className="file-input" {...getInputProps()} />
            <span className="file-cta">
              <span className="file-icon">
                <i className="fas fa-upload" />
              </span>
              <span className="file-label">Choose a file…</span>
            </span>
            <span className="file-name">{filename}</span>
            <span className="file-name">{records.length} records parsed</span>
          </label>
        </div>

        <LabeledPatientNumberInput
          stateHook={[start, setStart]}
          label={"Start data index"}
          inputId={"start"}
          delay={750}
        />

        <LabeledPatientNumberInput
          stateHook={[end, setEnd]}
          label={"End data index"}
          inputId={"end"}
          delay={750}
        />

        <LabeledPatientNumberInput
          stateHook={[precision, setPrecision]}
          label={"Data sparsity (1 is most precise)"}
          inputId={"precision"}
          delay={750}
        />
      </div>
      <div>
        <Line data={chartData} options={chartOptions} />
      </div>
    </>
  );
}
