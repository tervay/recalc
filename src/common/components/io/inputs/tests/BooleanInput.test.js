import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import { useState } from "react";

import BooleanInput from "../BooleanInput";

describe("Boolean input", () => {
  test("Renders", () => {
    const { result } = renderHook(() => useState(true));
    render(<BooleanInput stateHook={result.current} label="Label" />);
  });

  test("Checked on initially true", () => {
    const { result } = renderHook(() => useState(true));
    render(
      <BooleanInput stateHook={result.current} label="Label" inputId="input" />
    );
    expect(screen.getByLabelText("Label")).toBeChecked();
  });

  test("Checked on initially false", () => {
    const { result } = renderHook(() => useState(false));
    render(
      <BooleanInput stateHook={result.current} label="Label" inputId="input" />
    );
    expect(screen.getByLabelText("Label")).not.toBeChecked();
  });

  test("Changes when clicked", () => {
    const { result } = renderHook(() => useState(true));
    render(
      <BooleanInput stateHook={result.current} label="Label" inputId="input" />
    );

    fireEvent.click(screen.getByLabelText("Label"));
    expect(screen.getByLabelText("Label")).not.toBeChecked();
    expect(result.current[0]).toBe(false);

    fireEvent.click(screen.getByLabelText("Label"));
    expect(screen.getByLabelText("Label")).toBeChecked();
    expect(result.current[0]).toBe(true);
  });
});
