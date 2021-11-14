import {
  CartesianScaleOptions,
  CartesianScaleTypeRegistry,
  Chart,
  ChartOptions,
  registerables,
  ScaleOptionsByType,
} from "chart.js";
import { _DeepPartialObject } from "chart.js/types/utils";
import zoomPlugin from "chartjs-plugin-zoom";
import { ReactChart } from "chartjs-react";
import { isLocalhost } from "common/tooling/util";
import styles from "scss/exports.module.scss";

const chartColors = styles.chart_colors.split(isLocalhost() ? ", " : ",");

Chart.defaults.font.family = styles.font_family;
ReactChart.register(...registerables, zoomPlugin);

export type ScaleOptions = _DeepPartialObject<{
  [key: string]: ScaleOptionsByType<
    "radialLinear" | keyof CartesianScaleTypeRegistry
  >;
}>;

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

function makeTitle(options: Record<string, CartesianScaleOptions>): string {
  const ys = Object.entries(options).filter(([k, _]) => k !== "x");
  const x = Object.entries(options).find(([k, _]) => k === "x");
  if (x === undefined) {
    throw Error("Could not find x axis for graph!");
  }

  let yString = [
    ...new Set(
      ys
        .map(([_, v]) => v.title?.text)
        .filter((s) => s !== undefined && s.length > 0)
    ),
  ].join(", ");
  if (yString.includes(", ")) {
    yString = `[${yString}]`;
  }
  const xString = x[1].title?.text;
  return `${yString} vs ${xString}`;
}

export class GraphConfig {
  static options(
    scaleOptions: ScaleOptions,
    config: Configurable = { maintainAspectRatio: false, showLegend: true }
  ): ChartOptions {
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
            Object.entries(scaleOptions).reduce((acc, [k, v]) => {
              acc[k] = v as CartesianScaleOptions;
              return acc;
            }, {} as Record<string, CartesianScaleOptions>)
          ),
        },
        zoom: {
          pan: {
            enabled: true,
            mode: "xy",
          },
          zoom: {
            mode: "xy",
            wheel: {
              enabled: true,
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
    id: string
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
