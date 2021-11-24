import Metadata from "common/components/Metadata";
import flywheelConfig from "web/calculators/flywheel";
import FlywheelCalculator from "web/calculators/flywheel/components/FlywheelCalculator";
import { FlywheelReadme } from "web/calculators/readmes";

export default function FlywheelPage(): JSX.Element {
  return (
    <>
      <Metadata pageConfig={flywheelConfig} />
      <FlywheelCalculator />
      <FlywheelReadme />
    </>
  );
}
