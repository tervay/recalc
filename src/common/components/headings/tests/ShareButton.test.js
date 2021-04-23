import { fireEvent, render, screen } from "@testing-library/react";

import ShareButton from "../ShareButton";

describe("Share button", () => {
  test("Should render a button with text that says copy", () => {
    render(<ShareButton getQuery={() => {}} />);
    expect(screen.getByText("Copy link")).toBeVisible();
    expect(screen.getByText("Copy link").closest("button")).toBeVisible();
    expect(screen.getByText("Copy link").closest("button")).toBeEnabled();
    expect(screen.getByText("Copy link").closest("button")).toHaveClass(
      "button"
    );
  });

  test("Clicking calls given function in props and writes to clipboard", () => {
    const f = jest.fn().mockReturnValue("mock return value");
    const write = jest.fn();
    navigator.clipboard = {
      writeText: write,
    };

    render(<ShareButton getQuery={f} />);
    fireEvent.click(screen.getByText("Copy link"));
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenLastCalledWith();

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenLastCalledWith(
      "http://localhost/?mock return value"
    );
  });
});
