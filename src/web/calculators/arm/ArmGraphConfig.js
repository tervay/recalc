import { GraphConfig } from "common/tooling/GraphConfig";

export class ArmGraphConfig extends GraphConfig {
  static options() {
    let opts = super.options(
      {
        y: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "Current (A)",
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
      "Current Draw (A) vs Time (s)"
    );

    opts.maintainAspectRatio = true;
    return opts;
  }
}
