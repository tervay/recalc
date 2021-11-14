import LinearCalculator from "web/calculators/linear/components/LinearCalculator";
import { LinearReadme } from "web/calculators/readmes";

export default function LinearPage(): JSX.Element {
  return (
    <>
      <LinearCalculator />
      <LinearReadme />
    </>
  );
}
