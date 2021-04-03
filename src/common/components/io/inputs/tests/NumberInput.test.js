import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";

import { LabeledNumberInput } from "../NumberInput";

describe("Labeled number input", () => {
  test("Renders", () => {
    render(
      <LabeledNumberInput
        stateHook={useStateMock(1)}
        inputId="input"
        disabled={false}
        label="Label"
      />
    );
  });

  describe("Input has initial value", () => {
    test("of 1", () => {
      render(
        <LabeledNumberInput
          stateHook={useStateMock(1)}
          disabled={false}
          label="Label"
        />
      );
      expect(screen.getByLabelText("Label")).toHaveValue(1);
    });
    test("of 2", () => {
      render(
        <LabeledNumberInput
          stateHook={useStateMock(2)}
          disabled={false}
          label="Label"
        />
      );
      expect(screen.getByLabelText("Label")).toHaveValue(2);
    });
  });

  test("Disabled option disables input field", () => {
    render(
      <LabeledNumberInput
        stateHook={useStateMock(2)}
        disabled={true}
        label="Label"
      />
    );

    expect(screen.getByLabelText("Label")).toBeDisabled();
  });

  test("Lack of disabled option has field enabled", () => {
    render(<LabeledNumberInput stateHook={useStateMock(2)} label="Label" />);

    expect(screen.getByLabelText("Label")).toBeEnabled();
  });

  test("state hook is called on user typing", () => {
    const { result } = renderHook(() => useState(1));

    render(
      <LabeledNumberInput
        stateHook={result.current}
        disabled={false}
        label="Labelx"
      />
    );

    userEvent.clear(screen.getByLabelText("Labelx"));
    expect(result.current[0]).toEqual("");

    userEvent.type(screen.getByLabelText("Labelx"), "56");
    expect(result.current[0]).toEqual("56");
  });
});
