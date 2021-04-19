import { ChartBuilder, YAxisBuilder } from "common/tooling/charts";
import { isLocalhost } from "common/tooling/util";
import styles from "exports.module.scss";
import moment from "moment";
import propTypes from "prop-types";
import Select from "react-select";
import { decimate } from "web/calculators/dslogs/dataUtils";

const pdpColors = styles.pdp_colors.split(isLocalhost() ? ", " : ",");

const sharedAxisLabel = "Shared";

const buildSharedYBuilder = ({ value, label, getter, color }) => ({
  value,
  label,
  getYBuilder: ({ records, displayedRecords, useAbsoluteTime, precision }) =>
    new YAxisBuilder()
      .setTitleAndId(label)
      .setId(sharedAxisLabel)
      .setColor(color)
      .setData(
        decimate(
          displayedRecords.map((r) => ({
            x: useAbsoluteTime
              ? moment(r.time).toDate()
              : moment(r.time).diff(moment(records[0].time), "ms") / 1000.0,
            y: getter(r),
          })),
          precision
        )
      )
      .setDontBuildOptions(true),
});

const options = [
  {
    value: "voltage",
    label: "Voltage",
    getYBuilder: ({ records, displayedRecords, useAbsoluteTime, precision }) =>
      new YAxisBuilder()
        .setTitleAndId("Voltage")
        .setDisplayAxis(true)
        .setDraw(true)
        .setMinTicks(4.5)
        .setMaxTicks(13)
        .setColor(YAxisBuilder.chartColor(0))
        .setData(
          decimate(
            displayedRecords.map((r) => ({
              x: useAbsoluteTime
                ? moment(r.time).toDate()
                : moment(r.time).diff(moment(records[0].time), "ms") / 1000.0,
              y: r.voltage,
            })),
            precision
          )
        )
        .setPosition("left"),
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
                : moment(r.time).diff(moment(records[0].time), "ms") / 1000.0,
              y: r.pdpVoltage,
            })),
            precision
          )
        )
        .setDisplayAxis(true)
        .setDraw(false)
        .setPosition("left"),
  },
  buildSharedYBuilder({
    value: "canUsage",
    label: "CAN Usage (%)",
    getter: (r) => r.canUsage * 100,
    color: YAxisBuilder.chartColor(2),
  }),
  buildSharedYBuilder({
    value: "rioCpu",
    label: "RIO CPU (%)",
    getter: (r) => r.rioCpu * 100,
    color: YAxisBuilder.chartColor(3),
  }),
  buildSharedYBuilder({
    value: "roundTripTime",
    label: "Latency (ms)",
    getter: (r) => r.roundTripTime,
    color: YAxisBuilder.chartColor(4),
  }),
  buildSharedYBuilder({
    value: "wifiDb",
    label: "WiFi db",
    getter: (r) => r.wifiDb,
    color: YAxisBuilder.chartColor(5),
  }),
  buildSharedYBuilder({
    value: "pdpCurrent",
    label: "PDP Total Current",
    getter: (r) => r.pdpTotalCurrent,
    color: YAxisBuilder.chartColor(0),
  }),
].concat(
  [...Array(16).keys()].map((n) => {
    return buildSharedYBuilder({
      value: `pdpCurrent${n}`,
      label: `PDP ${n} Current`,
      getter: (r) => r.pdpCurrents[n],
      color: pdpColors[n],
    });
  })
);

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
    .setResponsive(true)
    .setXStartAtZero(!!useAbsoluteTime)
    .addYBuilder(
      new YAxisBuilder()
        .setPosition("right")
        .setDraw(false)
        .setDisplayAxis(true)
        .setTitleAndId(sharedAxisLabel)
        .setMinTicks(0)
        .setMaxTicks(120)
        .setData([])
    );

  if (plotted !== null) {
    plotted.forEach(({ getYBuilder }) => {
      cb.addYBuilder(
        getYBuilder({ records, displayedRecords, useAbsoluteTime, precision })
      );
    });
  }

  return cb;
}
