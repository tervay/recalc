import {
  Chart,
  ChartOptions,
  registerables,
  ScaleChartOptions,
} from "chart.js";
import { DeepPartial } from "chart.js/types/utils";
import zoomPlugin from "chartjs-plugin-zoom";
import { isLocalhost } from "common/tooling/util";
import styles from "scss/exports.module.scss";

const chartColors = styles.chart_colors.split(isLocalhost() ? ", " : ",");

Chart.defaults.font.family = styles.font_family;
Chart.register(...registerables, zoomPlugin);

type Configurable = {
  maintainAspectRatio: boolean;
  showLegend?: boolean;
};

export type GraphDataPoint = {
  x: number;
  y: number;
};

export type EzDataset = {
  label: string;
  data: GraphDataPoint[];
  borderColor: string;
  fill: boolean;
  cubicInterpolationMode: "monotone" | "default";
  yAxisID: string;
};

function makeTitle(axisTitles: Record<string, string>): string {
  const ys = Object.entries(axisTitles).filter(([k, _]) => k !== "x");
  const x = Object.entries(axisTitles).find(([k, _]) => k === "x");
  if (x === undefined) {
    throw Error("Could not find x axis for graph!");
  }

  let yString = [
    ...new Set(
      ys.map(([_, v]) => v).filter((s) => s !== undefined && s.length > 0),
    ),
  ].join(", ");
  if (yString.includes(", ")) {
    yString = `[${yString}]`;
  }
  const xString = x[1];
  return `${yString} vs ${xString}`;
}

export class GraphConfig {
  static options(
    scaleOptions: DeepPartial<ScaleChartOptions<"line">["scales"]>,
    config: Configurable = { maintainAspectRatio: false, showLegend: true },
  ): ChartOptions<"line"> {
    return {
      elements: {
        point: {
          radius: 0,
          hitRadius: 5,
        },
      },
      maintainAspectRatio: config.maintainAspectRatio,
      animation: false,
      plugins: {
        legend: {
          display: Object.keys(scaleOptions).length > 2 && config.showLegend,
        },
        title: {
          display: true,
          text: makeTitle(
            Object.keys(scaleOptions).reduce((acc, axisTitle) => {
              return {
                ...acc,
                [axisTitle]: scaleOptions[axisTitle]?.title?.text,
              };
            }, {}),
          ),
        },
        zoom: {
          pan: {
            enabled: false,
            mode: "xy",
          },
          zoom: {
            mode: "xy",
            wheel: {
              enabled: false,
            },
          },
        },
      },
      scales: scaleOptions,
    };
  }

  static chartColor(index: number): string {
    return chartColors[index];
  }

  static dataset(
    label: string,
    data: { x: number; y: number }[],
    colorIndex: number,
    id: string,
  ): EzDataset {
    return {
      label: label,
      data: data,
      borderColor: GraphConfig.chartColor(colorIndex),
      fill: false,
      cubicInterpolationMode: "monotone",
      yAxisID: id,
    };
  }
}
