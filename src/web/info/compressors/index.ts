import { CartesianScaleTypeRegistry, ScaleOptionsByType } from "chart.js";
import { _DeepPartialObject } from "chart.js/types/utils";
import { GraphConfig } from "common/components/graphing/graphConfig";
import Compressor from "common/models/Compressor";
import PageConfig from "common/models/PageConfig";
import { lazy } from "react";

const compressorsConfig: PageConfig = {
  url: "/compressors",
  title: "Compressor Playground",
  description: "Compressor playground",
  image: "/media/Compressor",
  component: lazy(() => import("./components/CompressorsPage")),
};

export default compressorsConfig;

const axes: {
  key: string;
  options: _DeepPartialObject<
    ScaleOptionsByType<"radialLinear" | keyof CartesianScaleTypeRegistry>
  >;
}[] = Compressor.getAllCompressors().map((c) => ({
  key: `y-${c.identifier}`,
  options: {
    type: "linear",
    display: c.identifier === Compressor.VIAIR_90C_12V().identifier,
    title: {
      display: true,
      text: "CFM (ft^3 / min)",
    },
    min: 0,
    max: 1.1,
  },
}));

export const graphConfig = GraphConfig.options(
  {
    ...Object.fromEntries(axes.map((a) => [a.key, a.options])),
    ...{
      x: {
        type: "linear",
        beginAtZero: true,
        title: {
          display: true,
          text: "Pressure (PSI)",
        },
        min: 0,
        max: 120,
      },
    },
  },
  {
    maintainAspectRatio: true,
    showLegend: true,
  },
);
