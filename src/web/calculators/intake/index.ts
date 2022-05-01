import { Stateify } from "common/models/ExtraTypes";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import PageConfig from "common/models/PageConfig";
import { MeasurementParam, MotorParam, RatioParam } from "common/models/Params";
import Ratio, { RatioType } from "common/models/Ratio";
import { lazy } from "react";
import { withDefault } from "serialize-query-params";

const intakeConfig: PageConfig = {
  url: "/intake",
  title: "Intake Calculator (WIP)",
  description: "Intake calculator (WIP)",
  version: 1,
  component: lazy(() => import("web/calculators/intake/components/IntakePage")),
};

export default intakeConfig;

export const IntakeParamsV1 = {
  motor: withDefault(MotorParam, Motor.Falcon500s(1)),
  ratio: withDefault(RatioParam, new Ratio(2, RatioType.REDUCTION)),
  rollerDiameter: withDefault(MeasurementParam, new Measurement(2, "in")),
  travelDistance: withDefault(MeasurementParam, new Measurement(15, "in")),
  drivetrainSpeed: withDefault(MeasurementParam, new Measurement(14, "ft/s")),
  targetTimeToGoal: withDefault(MeasurementParam, new Measurement(0.25, "s")),
};
export type IntakeStateV1 = Stateify<typeof IntakeParamsV1>;
