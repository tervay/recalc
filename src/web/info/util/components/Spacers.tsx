import SingleInputLine from "common/components/io/inputs/SingleInputLine";
import { MeasurementInput } from "common/components/io/new/inputs";
import MeasurementOutput from "common/components/io/outputs/MeasurementOutput";
import { Column, Columns } from "common/components/styling/Building";
import Measurement from "common/models/Measurement";
import { countBy } from "lodash";
import sortBy from "lodash/sortBy";
import { useMemo, useState } from "react";

interface SpacerSize {
  label: string;
  size: Measurement;
}

const imperialSizes: SpacerSize[] = [
  {
    label: '1/32"',
    size: new Measurement(1 / 32, "in"),
  },
  {
    label: '1/16"',
    size: new Measurement(1 / 16, "in"),
  },
  {
    label: '1/8"',
    size: new Measurement(1 / 8, "in"),
  },
  {
    label: '1/4"',
    size: new Measurement(1 / 4, "in"),
  },
  {
    label: '1/2"',
    size: new Measurement(1 / 2, "in"),
  },
  {
    label: '1"',
    size: new Measurement(1, "in"),
  },
  {
    label: '2"',
    size: new Measurement(2, "in"),
  },
];

export function countSpacers(
  targetSize: Measurement,
  spacerSizes: SpacerSize[],
): {
  spacers: SpacerSize[];
  remaining: Measurement;
} {
  const spacers = [];
  let remainingSize = targetSize;
  let sizesThatFit = sortBy(spacerSizes, (s) => s.size.baseScalar).filter((s) =>
    s.size.lte(remainingSize),
  );
  while (
    remainingSize.gte(new Measurement(0, "in")) &&
    sizesThatFit.length > 0
  ) {
    const spacer = sizesThatFit.pop()!;
    spacers.push(spacer);

    remainingSize = remainingSize.sub(spacer.size);
    sizesThatFit = sortBy(spacerSizes, (s) => s.size.baseScalar).filter((s) =>
      s.size.lte(remainingSize),
    );
  }

  return {
    spacers,
    remaining: remainingSize,
  };
}

export default function SpacerCalc(): JSX.Element {
  const [desiredLength, setDesiredLength] = useState(
    new Measurement(0.875, "in"),
  );

  const [enabledSizes, setEnabledSizes] = useState(() => {
    const initialEnabledSizes = imperialSizes.map(() => true); // Initially, all sizes are enabled
    return initialEnabledSizes;
  });

  const handleToggle = (index: number) => {
    setEnabledSizes((prev) => {
      const updatedSizes = [...prev];
      updatedSizes[index] = !updatedSizes[index];
      return updatedSizes;
    });
  };

  const out = useMemo(
    () =>
      countSpacers(
        desiredLength,
        enabledSizes
          .map((isEnabled, index) => imperialSizes[index])
          .filter((size, index) => enabledSizes[index]),
      ),
    [desiredLength, enabledSizes],
  );

  return (
    <>
      <div className="is-size-3">Spacers</div>
      <Columns>
        <Column>
          <SingleInputLine label="Desired Length">
            <MeasurementInput stateHook={[desiredLength, setDesiredLength]} />
          </SingleInputLine>

          <Columns multiline mobile>
            {imperialSizes.map((spacer, index) => (
              <Column>
                <SingleInputLine label={spacer.label}>
                  <div className="field">
                    <div className="control">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          className="recalc-switch"
                          onChange={() => handleToggle(index)}
                          defaultChecked={true}
                        />
                      </label>
                    </div>
                  </div>
                </SingleInputLine>
              </Column>
            ))}
          </Columns>
        </Column>

        <Column>
          <SingleInputLine label="Remaining Length">
            <MeasurementOutput
              stateHook={[out.remaining, () => {}]}
              defaultUnit="in"
              numberRoundTo={4}
            />
          </SingleInputLine>
          {Object.entries(countBy(out.spacers, (s) => s.label)).map(
            ([k, v]) => (
              <li>
                <b>{v}x</b> {k}
              </li>
            ),
          )}
        </Column>
      </Columns>
    </>
  );
}
