import { ChartBuilder, YAxisBuilder } from "common/tooling/charts";
import moment from "moment";
import propTypes from "prop-types";
import React from "react";
import Select from "react-select";
import { decimate } from "web/calculators/dslogs/dataUtils";

const options = [
  {
    value: "voltage",
    label: "Voltage",
    getYBuilder: ({
      records,
      displayedRecords,
      useAbsoluteTime,
      precision,
    }) => {
      return new YAxisBuilder()
        .setTitleAndId("Voltage")
        .setDisplayAxis(true)
        .setDraw(true)
        .setColor(YAxisBuilder.chartColor(0))
        .setData(
          decimate(
            displayedRecords.map((r) => ({
              x: useAbsoluteTime
                ? moment(r.time).toDate()
                : moment(r.time).diff(moment(records[0].time), "s"),
              y: r.voltage,
            })),
            precision
          )
        )
        .setPosition("left");
    },
  },
  {
    value: "pdpVoltage",
    label: "PDP Voltage",
    getYBuilder: ({ records, displayedRecords, useAbsoluteTime, precision }) =>
      new YAxisBuilder()
        .setTitleAndId("PDP Voltage")
        .setColor(YAxisBuilder.chartColor(1))
        .setData(
          decimate(
            displayedRecords.map((r) => ({
              x: useAbsoluteTime
                ? moment(r.time).toDate()
                : moment(r.time).diff(moment(records[0].time), "s"),
              y: r.pdpVoltage,
            })),
            precision
          )
        )
        .setDisplayAxis(true)
        .setDraw(false)
        .setPosition("right"),
  },
];

export function ChartChooser(props) {
  const [selected, setSelected] = props.stateHook;

  return (
    <div>
      <Select
        isMulti
        options={options}
        onChange={setSelected}
        defaultValue={selected}
        placeholder={"Select data..."}
      />
    </div>
  );
}

ChartChooser.propTypes = {
  stateHook: propTypes.arrayOf(propTypes.any, propTypes.func),
};

export function getChartBuilder({
  records,
  displayedRecords,
  useAbsoluteTime,
  precision,
  plotted,
}) {
  const cb = new ChartBuilder()
    .setPerformanceModeOn(true)
    .setTitle("Title")
    .setXTitle(useAbsoluteTime ? "Time" : "Seconds since log start")
    .setXAxisType(useAbsoluteTime ? "time" : "linear")
    .setMaintainAspectRatio(true)
    .setResponsive(true);

  if (plotted !== null) {
    plotted.forEach(({ getYBuilder }) => {
      cb.addYBuilder(
        getYBuilder({ records, displayedRecords, useAbsoluteTime, precision })
      );
    });
  }

  return cb;
}
