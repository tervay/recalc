import { render, screen } from "@testing-library/react";

import HeadingWithBgImage from "../HeadingWithBgImage";

describe("HeadingWithBgImage", () => {
  test("Should render a title and an image", () => {
    render(<HeadingWithBgImage title="My Title" image="/media/Motor" />);
    expect(screen.getByText("My Title")).toBeVisible();
    expect(screen.getByTestId("heading-bg-image-div")).toBeVisible();
    expect(screen.getByTestId("heading-bg-image-div")).toHaveStyle(
      `background-image: url(/media/Motor.png)`
    );
  });
});
