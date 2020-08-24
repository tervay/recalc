import styles from "index.scss";
import { defaults } from "lib/react-chart-js";

import {isLocalhost, uuid} from "./util";

defaults.global.defaultFontFamily = styles.font_family;

/**
 *
 * @param {{x: number, y: number, color: string}[]} data
 */
export function makeDataObj(data) {
  let chartColors;
  // build compress removes the space
  // idk how to fix ?? 🤔
  if (isLocalhost()) {
    chartColors = styles.chart_colors.split(", ")
  } else {
    chartColors = styles.chart_colors.split(",")
  }
  
  return {
    datasets: data.map((d, indx) => ({
      data: d,
      cubicInterpolationMode: "monotone",
      fill: false,
      borderColor: chartColors[indx],
      key: uuid(),
    })),
  };
}

export function horizontalMarker(at, from, to) {
  return [
    {
      x: from,
      y: at,
    },
    {
      x: to,
      y: at,
    },
  ];
}

export function verticalMarker(at, from, to) {
  return [
    {
      x: at,
      y: from,
    },
    {
      x: at,
      y: to,
    },
  ];
}

export function makeLineOptions(
  title,
  xTitle,
  yTitle,
  maintainAspectRatio = false
) {
  return {
    elements: {
      line: {
        tension: 0,
      },
      point: {
        radius: 0,
      },
    },
    title: {
      display: true,
      text: title,
    },
    legend: {
      display: false,
    },
    maintainAspectRatio: maintainAspectRatio,
    responsive: true,
    scales: {
      xAxes: [
        {
          type: "linear",
          position: "bottom",
          scaleLabel: {
            display: true,
            labelString: xTitle,
          },
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
          scaleLabel: {
            display: true,
            labelString: yTitle,
          },
        },
      ],
    },
  };
}
