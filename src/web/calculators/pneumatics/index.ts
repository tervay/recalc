import { GraphConfig } from "common/components/graphing/graphConfig";
import Compressor from "common/models/Compressor";
import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import PageConfig from "common/models/PageConfig";
import {
  CompressorParam,
  MeasurementParam,
  PistonListParam,
} from "common/models/Params";
import Piston from "common/models/Piston";
import PistonList from "common/models/PistonList";
import { lazy } from "react";
import { withDefault } from "serialize-query-params";

const pneumaticsConfig: PageConfig = {
  url: "/pneumatics",
  title: "Pneumatics Calculator",
  description: "Pneumatics calc",
  image: "/media/Pneumatics",
  version: 1,
  component: lazy(
    () => import("web/calculators/pneumatics/components/PneumaticsPage"),
  ),
};
export default pneumaticsConfig;

export const PneumaticsParamsV1 = {
  pistons: withDefault(
    PistonListParam,
    new PistonList([
      new Piston(
        "Cylinder 1",
        1,
        new Measurement(1.5, "in"),
        Piston.rodDiameterFromBore(new Measurement(1.5, "in")),
        new Measurement(12, "in"),
        new Measurement(60, "psi"),
        new Measurement(60, "psi"),
        true,
        new Measurement(8, "s"),
      ),
      new Piston(
        "Cylinder 2",
        2,
        new Measurement(0.75, "in"),
        Piston.rodDiameterFromBore(new Measurement(1, "in")),
        new Measurement(6, "in"),
        new Measurement(60, "psi"),
        new Measurement(60, "psi"),
        true,
        new Measurement(12, "s"),
      ),
    ]),
  ),
  tankVolume: withDefault(MeasurementParam, new Measurement(574 * 2, "cm^3")),
  compressor: withDefault(CompressorParam, Compressor.VIAIR_90C_12V()),
};

export type PneumaticsStateV1 = Stateify<typeof PneumaticsParamsV1>;

export const pneumaticsGraphConfig = GraphConfig.options(
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
  {
    maintainAspectRatio: true,
  },
);
