import Bearings from "web/info/util/components/Bearings";
import MountingCheatSheet from "web/info/util/components/MountingCheatSheet";

export default function Util(): JSX.Element {
  return (
    <>
      <MountingCheatSheet />
      <Bearings />
      {/* <ExtrusionPrices /> */}
    </>
  );
}
