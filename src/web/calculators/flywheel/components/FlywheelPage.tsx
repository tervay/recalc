import FlywheelCalculator from "web/calculators/flywheel/components/FlywheelCalculator";
import { FlywheelReadme } from "web/calculators/readmes";

export default function FlywheelPage(): JSX.Element {
  return (
    <>
      <FlywheelCalculator />
      <FlywheelReadme />
    </>
  );
}
