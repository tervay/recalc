import styles from "index.scss";
import { defaults } from "lib/react-chart-js";

import { isLocalhost, uuid } from "./util";

defaults.global.defaultFontFamily = styles.font_family;

/**
 *
 * @param {{x: Number, y: Number}[]} data
 * @param {Number} numCharts
 */
export function makeDataObj(data, numCharts = 1) {
  let chartColors;
  // build compress removes the space
  // idk how to fix ?? 🤔
  if (isLocalhost()) {
    chartColors = styles.chart_colors.split(", ");
  } else {
    chartColors = styles.chart_colors.split(",");
  }

  return {
    datasets: data.map((d, indx) => ({
      data: d,
      cubicInterpolationMode: "monotone",
      fill: false,
      borderColor: chartColors[indx],
      key: uuid(),
      yAxisID: indx < numCharts ? String(indx) : undefined,
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
  yTitles,
  numCharts = 1,
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
      display: true,
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
      yAxes: [...Array(numCharts).keys()].map((k) => ({
        ticks: {
          beginAtZero: true,
        },
        scaleLabel: {
          display: true,
          labelString: yTitles[k],
        },
        id: String(k),
        position: ["left", "right", "left"][k],
        gridLines: {
          drawOnChartArea: k === 0, // only want the grid lines for one axis to show up
        },
      })),
    },
  };
}

export class MarkerBuilder {
  constructor() {}

  vertical() {
    this._vertical = true;
    this._horizontal = false;
    return this;
  }

  horizontal() {
    this._vertical = false;
    this._horizontal = true;
    return this;
  }

  at(at) {
    this._at = at;
    return this;
  }

  from(from) {
    this._from = from;
    return this;
  }

  to(to) {
    this._to = to;
    return this;
  }

  build() {
    if (this._horizontal) {
      return [
        {
          x: this._from,
          y: this._at,
        },
        {
          x: this._to,
          y: this._at,
        },
      ];
    } else if (this._vertical) {
      return [
        {
          x: this._at,
          y: this._from,
        },
        {
          x: this._at,
          y: this._to,
        },
      ];
    } else {
      return [];
    }
  }
}

export class YAxisBuilder {
  constructor() {}

  setTitleAndId(title) {
    this._title = title;
    this._id = title;
    return this;
  }

  setPosition(position) {
    this._position = position;
    return this;
  }

  setColor(color) {
    this._color = color;
    return this;
  }

  setId(id) {
    this._id = id;
    return this;
  }

  setDraw(draw) {
    this._drawOnChartArea = draw;
    return this;
  }

  setData(data) {
    this._data = data;
    return this;
  }

  setDisplayAxis(displayAxis) {
    this._displayAxis = displayAxis;
    return this;
  }

  buildData() {
    return {
      data: this._data,
      cubicInterpolationMode: "monotone",
      fill: false,
      borderColor: this._color,
      yAxisID: this._id,
      label: this._title,
    };
  }

  buildOptions() {
    return {
      display: this._displayAxis === undefined ? true : this._displayAxis,
      ticks: {
        beginAtZero: true,
      },
      scaleLabel: {
        display: true,
        labelString: this._title,
      },
      id: this._id,
      position: this._position,
      gridLines: {
        drawOnChartArea:
          this._drawOnChartArea === undefined ? true : this._drawOnChartArea,
      },
    };
  }
}

export class ChartBuilder {
  constructor() {}

  setTitle(title) {
    this._title = title;
    return this;
  }

  setXTitle(xTitle) {
    this._xTitle = xTitle;
    return this;
  }

  addYBuilder(yBuilders) {
    if (this._yBuilders === undefined) {
      this._yBuilders = [];
    }

    this._yBuilders.push(yBuilders);
    return this;
  }

  setMaintainAspectRatio(maintainAspectRatio) {
    this._maintainAspectRatio = maintainAspectRatio;
    return this;
  }

  setLegendEnabled(legendEnabled) {
    this._legendEnabled = legendEnabled;
    return this;
  }

  setResponsive(responsive) {
    this._responsive = responsive;
    return this;
  }

  buildData() {
    return {
      datasets: this._yBuilders.map((yb) => yb.buildData()),
    };
  }

  buildOptions() {
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
        display: this._title !== undefined,
        text: this._title,
      },
      legend: {
        display: this._legendEnabled === undefined ? true : this._legendEnabled,
      },
      maintainAspectRatio: this._maintainAspectRatio || false,
      responsive: this._responsive === undefined ? true : this._responsive,
      scales: {
        xAxes: [
          {
            type: "linear",
            position: "bottom",
            scaleLabel: {
              display: true,
              labelString: this._xTitle,
            },
            ticks: {
              beginAtZero: true,
            },
          },
        ],
        yAxes: this._yBuilders.map((yb) => yb.buildOptions()),
      },
    };
  }

  static defaultData() {
    return {
      datasets: [],
    };
  }

  static defaultOptions() {
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
        display: false,
      },
      legend: {
        display: false,
      },
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        xAxes: [
          {
            type: "linear",
            position: "bottom",
            scaleLabel: {
              display: false,
            },
            ticks: {
              beginAtZero: true,
            },
          },
        ],
        yAxes: [],
      },
    };
  }
}
