import { Markdown } from "common/components/styling/Building";
import React from "react";

import _beltsReadme from "web/calculators/belts/readme.md?raw";
export const BeltsReadme = React.memo(() => <Markdown markdownContent={_beltsReadme} />);

import _pneumaticsReadme from "web/calculators/pneumatics/readme.md?raw";
export const PneumaticsReadme = React.memo(() => <Markdown markdownContent={_pneumaticsReadme} />);

import _flywheelReadme from "web/calculators/flywheel/readme.md?raw";
export const FlywheelReadme = React.memo(() => <Markdown markdownContent={_flywheelReadme} />);

import _armReadme from "web/calculators/arm/readme.md?raw";
export const ArmReadme = React.memo(() => <Markdown markdownContent={_armReadme} />);

import _linearReadme from "web/calculators/linear/readme.md?raw";
export const LinearReadme = React.memo(() => <Markdown markdownContent={_linearReadme} />);

import _motorsReadme from "web/info/motors/readme.md?raw";
export const MotorsReadme = React.memo(() => <Markdown markdownContent={_motorsReadme} />);
