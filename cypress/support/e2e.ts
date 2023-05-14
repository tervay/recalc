// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

import { Optional } from "ts-toolbelt/out/Object/Optional";

// Alternatively you can use CommonJS syntax:
// require('./commands')

type Metadata = {
  name: string;
  url: string;
};

type IdToElementMap = Record<string, string>;

type IOify<T extends IdToElementMap> = {
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

type ChangedInputAndCorrespondingValues<
  NumberedInputsType extends IdToElementMap,
  SelectType extends IdToElementMap,
  SecondaryInputsType extends IdToElementMap,
  NumberedOutputsType extends IOify<IdToElementMap>
> = [
  ChangeAction<NumberedInputsType, SelectType>,
  NumberedOutputsType &
    Optional<IOify<SecondaryInputsType> & IOify<NumberedInputsType>>
];

function changeActionToString<T, V>(changeAction: ChangeAction<T, V>): string {
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

export function generateIOTests<
  InputsType extends IdToElementMap,
  OutputsType extends IdToElementMap,
  SelectType extends IdToElementMap,
  SecondaryInputsType extends IdToElementMap
>(
  metadata: Metadata,
  inputs: InputsType,
  outputs: IdToElementMap,
  allSelects: SelectType,
  changeAndChecks: ChangedInputAndCorrespondingValues<
    InputsType,
    SelectType,
    SecondaryInputsType,
    IOify<OutputsType>
  >[],
  secondaryInputs?: SecondaryInputsType
): void {
  describe(`${metadata.name} auto-generated E2E test suite`, () => {
    beforeEach(() => {
      cy.visit(metadata.url);
    });

    it("All inputs are visible & enabled", () => {
      Object.values({ ...inputs, ...allSelects }).forEach((testId) => {
        cy.getByTestId(testId).should("be.visible").should("be.enabled");
      });
    });

    it("has all outputs visible and disabled", () => {
      Object.values(outputs).forEach((testId) => {
        cy.getByTestId(testId).should("be.visible").should("be.disabled");
      });
    });

    changeAndChecks.forEach(([changeAction, expecteds]) => {
      it(`[${changeActionToString(changeAction)}] => then check inputs`, () => {
        if (changeAction.queryString) {
          cy.visit(metadata.url + changeAction.queryString.value);
        }

        if (changeAction.change) {
          cy.getByTestId(inputs[changeAction.change.key])
            .clear()
            .should("have.value", "")
            .type(changeAction.change.value)
            .should("have.value", changeAction.change.value);
        }

        if (changeAction.select) {
          cy.getByTestId(allSelects[changeAction.select.key])
            .select(changeAction.select.value)
            .should("have.value", changeAction.select.value);
        }

        const allDivs = { ...outputs, ...inputs, ...secondaryInputs };
        Object.entries(expecteds).forEach(([k, v]) => {
          if (v === null) {
            return;
          }

          if (typeof v === "boolean") {
            cy.getByTestId(allDivs[k]).should(
              v ? "be.checked" : "not.be.checked"
            );
          } else {
            cy.getByTestId(allDivs[k], { timeout: 20000 }).should(
              "have.value",
              v
            );
          }
        });
      });
    });
  });
}
