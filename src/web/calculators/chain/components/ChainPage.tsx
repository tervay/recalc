import Metadata from "common/components/Metadata";
import chainConfig from "web/calculators/chain";
import ChainCalculator from "web/calculators/chain/components/ChainCalculator";

export default function ChainPage(): JSX.Element {
  return (
    <>
      <Metadata pageConfig={chainConfig} />
      <ChainCalculator />
    </>
  );
}
