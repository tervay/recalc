import { fireEvent, render, screen } from "@testing-library/react";

import Heading from "../Heading";

describe("Heading", () => {
  test("Should render a title and a button", () => {
    render(<Heading title={"My Title"} getQuery={() => {}} />);
    expect(screen.getByText("My Title")).toBeVisible();
    expect(screen.getByText("Copy link")).toBeVisible();
    expect(screen.getByText("Copy link")).toBeEnabled();
  });

  test("Passes getQuery prop to ShareButton child", () => {
    const f = jest.fn().mockReturnValue("mock return value");
    const write = jest.fn();
    navigator.clipboard = {
      writeText: write,
    };

    render(<Heading title={"My Title"} getQuery={f} />);
    fireEvent.click(screen.getByText("Copy link"));
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenLastCalledWith();

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenLastCalledWith(
      "http://localhost/?mock return value"
    );
  });
});
