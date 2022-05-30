import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockLocation } from "common/tooling/testing";
import { IdToElementMap } from "testing/calculatorMatchers";
import { Optional } from "ts-toolbelt/out/Object/Optional";

type Details = {
  name: string;
};

type Numberify<T extends IdToElementMap> = {
  [K in keyof T]: number | string | boolean | null;
};

type ChangeAction<T, V> = {
  change?: {
    key: keyof T;
    value: string;
  };
  select?: {
    key: keyof V;
    value: string;
  };
  queryString?: {
    value: string;
  };
};

export function changeActionToString<T, V>(
  changeAction: ChangeAction<T, V>
): string {
  const s = [];

  if (changeAction.change) {
    s.push(
      `Changing ${String(changeAction.change.key)} to ${
        changeAction.change.value
      }`
    );
  }

  if (changeAction.queryString) {
    s.push(`Loading query string ${changeAction.queryString.value}`);
  }

  if (changeAction.select) {
    s.push(
      `Selecting ${String(changeAction.select.key)} as ${
        changeAction.select.value
      }`
    );
  }

  return s.join(" | ");
}

type ChangedInputAndCorrespondingValues<
  NumberedInputsType extends IdToElementMap,
  SelectType extends IdToElementMap,
  SecondaryInputsType extends IdToElementMap,
  NumberedOutputsType extends Numberify<IdToElementMap>
> = [
  ChangeAction<NumberedInputsType, SelectType>,
  NumberedOutputsType &
    Optional<Numberify<SecondaryInputsType> & Numberify<NumberedInputsType>>
];

export default function testWrapper<
  InputsType extends IdToElementMap,
  OutputsType extends IdToElementMap,
  SelectType extends IdToElementMap,
  SecondaryInputsType extends IdToElementMap
>(
  component: JSX.Element,
  details: Details,
  inputs: IdToElementMap,
  outputs: IdToElementMap,
  allSelects: IdToElementMap,
  changeAndChecks: ChangedInputAndCorrespondingValues<
    InputsType,
    SelectType,
    SecondaryInputsType,
    Numberify<OutputsType>
  >[],
  secondaryInputs?: SecondaryInputsType,
  waitForElements?: (() => HTMLElement)[]
): void {
  const prep = async () =>
    await act(async () => {
      render(component);
      waitForElements?.forEach(async (e) => {
        await waitFor(e);
      });
    });

  describe(`${details.name} auto-generated test suite`, () => {
    test("Everything is visible", async () => {
      await prep();

      expect({
        ...inputs,
        ...outputs,
        ...secondaryInputs,
      }).toAllBeVisible();
    });

    test("Inputs are enabled", async () => {
      await prep();
      expect(inputs).toAllBeEnabled();
    });

    test("Outputs are disabled", async () => {
      await prep();
      expect(outputs).toAllBeDisabled();
    });

    changeAndChecks.forEach(([changeAction, expecteds]) => {
      test(`[${changeActionToString(
        changeAction
      )}] => then check inputs`, async () => {
        if (changeAction.queryString) {
          mockLocation(
            "http://localhost:3000/" + changeAction.queryString.value
          );
        }
        await prep();
        await act(async () => {
          if (changeAction.change) {
            await userEvent.clear(inputs[changeAction.change.key as string]());
            await userEvent.type(
              inputs[changeAction.change.key as string](),
              changeAction.change.value
            );
          }

          if (changeAction.select) {
            await userEvent.selectOptions(
              allSelects[changeAction.select.key as string](),
              [changeAction.select.value]
            );
          }
        });

        await waitFor(() => {
          Object.entries(expecteds).map(([k, v]) => {
            if (v === null) {
              return;
            }

            let objWithDiv = outputs;
            if (inputs.hasOwnProperty(k)) {
              objWithDiv = inputs;
            }
            if (secondaryInputs?.hasOwnProperty(k)) {
              objWithDiv = secondaryInputs;
            }

            const divToCheck = objWithDiv[k]();
            if (typeof v === "boolean") {
              const expectation = v
                ? expect(divToCheck)
                : expect(divToCheck).not;
              expectation.toBeChecked();
            } else {
              expect(divToCheck).toHaveValue(v);
            }
          });
        });
      });
    });
  });
}

export function allValue<T extends IdToElementMap>(
  elements: T,
  value: number
): Numberify<T> {
  return Object.fromEntries(Object.entries(elements).map((e) => [e, value]));
}

export function allValueExcept<T extends IdToElementMap>(
  key: string,
  elements: T,
  value: number
): Numberify<IdToElementMap> {
  const { [key]: _, ...rest } = elements;
  return allValue(rest, value);
}
