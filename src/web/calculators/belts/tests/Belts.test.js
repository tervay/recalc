import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Belts from "../Belts";

describe("Belts calculator", () => {
  test("Renders", () => {
    render(<Belts />);
  });

  test("Should see all inputs & outputs", () => {
    render(<Belts />);

    expect(screen.getByLabelText("Pitch")).toBeVisible();
    expect(screen.getByLabelText("Desired Center")).toBeVisible();
    expect(screen.getByLabelText("Extra Center")).toBeVisible();
    expect(screen.getByLabelText("Teeth in mesh")).toBeVisible();
    expect(screen.getByLabelText("Belt tooth increment")).toBeVisible();
    expect(screen.getByLabelText("Belt tooth maximum")).toBeVisible();
    expect(screen.getByLabelText("Belt Teeth")).toBeVisible();
    expect(screen.getAllByLabelText("Teeth")).toHaveLength(4);
    screen.getAllByLabelText("Teeth").forEach((div) => {
      expect(div).toBeVisible();
    });
    expect(screen.getByTestId("smallerCenterDistanceInput")).toBeVisible();
    expect(screen.getByTestId("largerCenterDistanceInput")).toBeVisible();
    expect(screen.getByTestId("smallerBeltTeeth")).toBeVisible();
    expect(screen.getByTestId("largerBeltTeeth")).toBeVisible();
  });

  test("Changing pitch changes outputs", () => {
    render(<Belts />);

    userEvent.clear(screen.getByLabelText("Pitch"));

    expect(screen.getByTestId("smallerCenterDistanceInput")).toHaveValue(
      "0.0000"
    );
    expect(screen.getByTestId("largerCenterDistanceInput")).toHaveValue(
      "0.0000"
    );
    expect(screen.getByTestId("smallerBeltTeeth")).toHaveValue(15);
    expect(screen.getByTestId("largerBeltTeeth")).toHaveValue(20);

    userEvent.type(screen.getByLabelText("Pitch"), "7");

    expect(screen.getByTestId("smallerCenterDistanceInput")).toHaveValue(
      "4.8100"
    );
    expect(screen.getByTestId("largerCenterDistanceInput")).toHaveValue(
      "5.5006"
    );
    expect(screen.getByTestId("smallerBeltTeeth")).toHaveValue(55);
    expect(screen.getByTestId("largerBeltTeeth")).toHaveValue(60);
    expect(screen.getByLabelText("Teeth in mesh")).toHaveValue(7.6);
  });
});
