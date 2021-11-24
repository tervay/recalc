import Metadata from "common/components/Metadata";
import motorsConfig from "web/info/motors";
import Playground from "./Playground";
import SpecTable from "./SpecTable";

export default function Motors(): JSX.Element {
  return (
    <>
      <Metadata pageConfig={motorsConfig} />
      <SpecTable />
      <Playground />
    </>
  );
}
