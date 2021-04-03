import { isLocalhost } from "common/tooling/util";
import styles from "exports.module.scss";
import { defaults } from "lib/react-chart-js";
import _ from "lodash";

defaults.global.defaultFontFamily = styles.font_family;
const chartColors = styles.chart_colors.split(isLocalhost() ? ", " : ",");

export class MarkerBuilder {
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
  setTitleAndId(title) {
    this._title = title;
    this._id = title;
    return this;
  }

  setPosition(position) {
    this._position = position;
    return this;
  }

  static chartColor(i) {
    return chartColors[i];
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

  setBeginAtZero(beginAtZero) {
    this._beginAtZero = beginAtZero;
    return this;
  }

  setMinTicks(minTicks) {
    this._minTicks = minTicks;
    return this;
  }

  setMaxTicks(maxTicks) {
    this._maxTicks = maxTicks;
    return this;
  }

  setDontBuildOptions(dontBuildOptions) {
    this._dontBuildOptions = dontBuildOptions;
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
    if (this._dontBuildOptions) {
      return {};
    }

    let ticks;
    if (this._minTicks !== undefined && this._maxTicks !== undefined) {
      ticks = {
        min: this._minTicks,
        max: this._maxTicks,
      };
    } else {
      ticks = {
        beginAtZero: this._beginAtZero,
      };
    }

    return {
      display: this._displayAxis === undefined ? true : this._displayAxis,
      ticks: ticks,
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

  setXAxisType(axisType) {
    this._axisType = axisType;
    return this;
  }

  setPerformanceModeOn(performanceMode) {
    this._performanceMode = performanceMode;
    return this;
  }

  setXStartAtZero(xStartAtZero) {
    this._xStartAtZero = xStartAtZero;
    return this;
  }

  buildData() {
    return {
      datasets: this._yBuilders.map((yb) => yb.buildData()),
    };
  }

  buildOptions() {
    let defaultOptions = {};
    if (this._performanceMode) {
      defaultOptions = _.merge(defaultOptions, {
        animation: {
          duration: 0,
        },
        hover: {
          animationDuration: 0,
        },
        responsiveAnimationDuration: 0,
      });
    }

    const generatedOptions = {
      plugins: ChartBuilder.getPlugins(),
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
            type: this._axisType,
            position: "bottom",
            scaleLabel: {
              display: true,
              labelString: this._xTitle,
            },
            ticks: {
              beginAtZero: this._xStartAtZero,
            },
            time: {
              unit: "second",
            },
          },
        ],
        yAxes: this._yBuilders
          .map((yb) => yb.buildOptions())
          .filter((o) => Object.keys(o).length > 0),
      },
    };

    return _.merge(defaultOptions, generatedOptions);
  }

  static defaultData() {
    return {
      datasets: [],
    };
  }

  static defaultOptions() {
    return {
      plugins: ChartBuilder.getPlugins(),
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
      maintainAspectRatio: true,
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

  static getPlugins() {
    return {
      zoom: {
        // Container for pan options
        pan: {
          // Boolean to enable panning
          enabled: true,

          // Panning directions. Remove the appropriate direction to disable
          // Eg. 'y' would only allow panning in the y direction
          mode: "xy",
        },

        // Container for zoom options
        zoom: {
          // Boolean to enable zooming
          enabled: true,

          // Zooming directions. Remove the appropriate direction to disable
          // Eg. 'y' would only allow zooming in the y direction
          mode: "xy",
        },
      },
    };
  }
}
