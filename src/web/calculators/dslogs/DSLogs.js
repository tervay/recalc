import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { DSLogParser } from "./parser";

export default function DSLogs() {
  const [records, setRecords] = useState([]);
  const [displayedRecords, setDisplayedRecords] = useState(records);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles) => {
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
          console.log("set records");
        };
        reader.readAsArrayBuffer(file);
      });
    },
    [start, end, displayedRecords, records]
  );
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
            setDisplayedRecords(records.slice(start, end));
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
        <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>Time</th>
              <th>Voltage</th>
              <th>State</th>
              <th>CAN Usage</th>
            </tr>
          </thead>

          <tbody>
            {displayedRecords.map((r) => (
              <tr key={r.time}>
                <td>{r.time}</td>
                <td>{r.voltage}</td>
                <td>
                  {((ds, robot) => {
                    let s1 = "";
                    let s2 = "";

                    if (ds.auto) s1 = "auto";
                    else if (ds.tele) s1 = "tele";
                    else if (ds.disabled) s1 = "disabled";
                    else s1 = "unknown";

                    if (robot.auto) s2 = "auto";
                    else if (robot.tele) s2 = "tele";
                    else if (robot.disabled) s2 = "disabled";
                    else s2 = "unknown";

                    return `DS ${s1} / Robot ${s2}`;
                  })(
                    { tele: r.dsTele, auto: r.dsAuto, disabled: r.dsDisabled },
                    {
                      tele: r.robotTele,
                      auto: r.robotAuto,
                      disabled: r.robotDisabled,
                    }
                  )}
                </td>
                <td>{r.canUsage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
