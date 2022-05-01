import { ChartOptions } from "chart.js";
import { EzDataset } from "common/components/graphing/types";
import {
  Level,
  LevelItem,
  LevelLeft,
  LevelRight,
  Title,
} from "common/components/styling/Building";
import { Chart } from "react-chartjs-2";

// function setZoomPluginEnabled(
//   options: ChartOptions<"line">,
//   enabled: boolean
// ): ChartOptions<"line"> {
//   if (options.plugins?.zoom?.zoom?.wheel?.enabled !== undefined) {
//     options.plugins.zoom.zoom.wheel.enabled = enabled;
//   }
//   if (options.plugins?.zoom?.pan?.enabled !== undefined) {
//     options.plugins.zoom.pan.enabled = enabled;
//   }

//   return options;
// }

// export function makeResetFunction(id: string): () => void {
//   return () => {
//     const instance = ChartJS.getChart(id);
//     instance?.resetZoom();
//   };
// }

export default function Graph(props: {
  title: string;
  id: string;
  height?: number;

  options: ChartOptions<"line">;
  simpleDatasets: EzDataset[];
}): JSX.Element {
  // const [zoomEnabled, setZoomEnabled] = useState(false);
  // const [options, setOptions] = useState(props.options);

  // useEffect(() => {
  //   setOptions(setZoomPluginEnabled(options, zoomEnabled));
  //   if (zoomEnabled) {
  //     makeResetFunction(props.id)();
  //   }
  // }, [zoomEnabled]);

  return (
    <div className="box remove-hover" style={{ width: "99%" }}>
      <Level paddingLess marginLess>
        <LevelLeft>
          <LevelItem>
            <Title>{props.title}</Title>
          </LevelItem>
        </LevelLeft>
        <LevelRight>
          <LevelItem>
            {/* <SingleInputLine label="Toggle Zoom">
              <BooleanInput stateHook={[zoomEnabled, setZoomEnabled]} />
            </SingleInputLine> */}
          </LevelItem>
          <LevelItem>
            {/* <Button
              color="primary"
              onClick={makeResetFunction(props.id)}
              faIcon="binoculars"
              disabled={!zoomEnabled}
            >
              Reset Zoom
            </Button> */}
          </LevelItem>
        </LevelRight>
      </Level>

      <div
        style={{
          maxHeight: `${props.height ?? 100000}px`,
          height: `${props.height}px`,
        }}
      >
        <Chart
          type="line"
          options={props.options}
          data={{ datasets: props.simpleDatasets }}
        />
      </div>
    </div>
  );
}
