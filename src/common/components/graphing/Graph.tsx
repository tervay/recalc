import { Chart, ChartOptions } from "chart.js";
import { ChartProps, ReactChart } from "chartjs-react";
import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { BooleanInput } from "common/components/io/new/inputs";
import {
  Button,
  Level,
  LevelItem,
  LevelLeft,
  LevelRight,
  Title,
} from "common/components/styling/Building";
import { useEffect, useState } from "react";

function setZoomPluginEnabled(
  options: ChartOptions,
  enabled: boolean
): ChartOptions {
  if (options.plugins?.zoom?.zoom?.wheel?.enabled !== undefined) {
    options.plugins.zoom.zoom.wheel.enabled = enabled;
  }
  if (options.plugins?.zoom?.pan?.enabled !== undefined) {
    options.plugins.zoom.pan.enabled = enabled;
  }

  return options;
}

export default function Graph(
  props: ChartProps & { title: string; id: string; height?: number }
): JSX.Element {
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const [options, setOptions] = useState(props.options);

  useEffect(() => {
    setOptions(setZoomPluginEnabled(options, zoomEnabled));
    if (zoomEnabled) {
      makeResetFunction(props.id)();
    }
  }, [zoomEnabled]);

  return (
    <div className="box remove-hover">
      <Level paddingLess marginLess>
        <LevelLeft>
          <LevelItem>
            <Title>{props.title}</Title>
          </LevelItem>
        </LevelLeft>
        <LevelRight>
          <LevelItem>
            <SingleInputLine label="Toggle Zoom">
              <BooleanInput stateHook={[zoomEnabled, setZoomEnabled]} />
            </SingleInputLine>
          </LevelItem>
          <LevelItem>
            <Button
              color="primary"
              onClick={makeResetFunction(props.id)}
              faIcon="binoculars"
              disabled={!zoomEnabled}
            >
              Reset Zoom
            </Button>
          </LevelItem>
        </LevelRight>
      </Level>

      <div style={{ maxHeight: `${props.height ?? 100000}px` }}>
        <ReactChart {...props} options={options} />
      </div>
    </div>
  );
}

export function makeResetFunction(id: string): () => void {
  return () => {
    const instance = Chart.getChart(id);
    instance?.resetZoom();
  };
}
