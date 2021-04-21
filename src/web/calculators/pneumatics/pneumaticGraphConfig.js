import { GraphConfig } from "common/tooling/GraphConfig";

export class PneumaticGraphConfig extends GraphConfig {
  static options() {
    let opts = super.options(
      {
        y: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "System Pressure (psi)",
          },
          position: "left",
        },
        x: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "Time (s)",
          },
        },
      },
      "System Pressure (psi) vs Time (s)"
    );

    opts.maintainAspectRatio = true;
    return opts;
  }
}
