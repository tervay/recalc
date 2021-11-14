import { Markdown } from "common/components/styling/Building";
import React from "react";

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import _beltsReadme from "!!raw-loader!web/calculators/belts/readme.md";
export const BeltsReadme = React.memo(() => <Markdown markdownContent={_beltsReadme} />);

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import _pneumaticsReadme from "!!raw-loader!web/calculators/pneumatics/readme.md";
export const PneumaticsReadme = React.memo(() => <Markdown markdownContent={_pneumaticsReadme} />);

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import _flywheelReadme from "!!raw-loader!web/calculators/flywheel/readme.md";
export const FlywheelReadme = React.memo(() => <Markdown markdownContent={_flywheelReadme} />);

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import _armReadme from "!!raw-loader!web/calculators/arm/readme.md";
export const ArmReadme = React.memo(() => <Markdown markdownContent={_armReadme} />);

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import _linearReadme from "!!raw-loader!web/calculators/linear/readme.md";
export const LinearReadme = React.memo(() => <Markdown markdownContent={_linearReadme} />);
