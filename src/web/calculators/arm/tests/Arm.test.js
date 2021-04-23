import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Arm from "../Arm";

describe("Arm calculator", () => {
  test("Renders", async () => {
    await act(async () => {
      render(<Arm />);
    });
  });

  test("Should see all inputs & outputs", async () => {
    await act(async () => {
      render(<Arm />);
    });

    expect(screen.getByLabelText("Motor")).toBeVisible();
    expect(screen.getByLabelText("Ratio")).toBeVisible();
    expect(screen.getByLabelText("CoM Distance")).toBeVisible();
    expect(screen.getByLabelText("Arm Mass")).toBeVisible();
    expect(screen.getByLabelText("Current Limit")).toBeVisible();
    expect(screen.getByLabelText("Start Angle")).toBeVisible();
    expect(screen.getByLabelText("End Angle")).toBeVisible();
    expect(screen.getByLabelText("Iteration Limit")).toBeVisible();
    expect(screen.getByLabelText("Time to goal")).toBeVisible();
  });

  test("Should see initial state on i/o", async () => {
    await act(async () => {
      render(<Arm />);
    });

    expect(screen.getByLabelText("Motor")).toHaveValue(2);
    expect(screen.getByLabelText("Ratio")).toHaveValue(100);
    expect(screen.getByLabelText("CoM Distance")).toHaveValue(20);
    expect(screen.getByLabelText("Arm Mass")).toHaveValue(15);
    expect(screen.getByLabelText("Current Limit")).toHaveValue(40);
    expect(screen.getByLabelText("Start Angle")).toHaveValue(0);
    expect(screen.getByLabelText("End Angle")).toHaveValue(90);
    expect(screen.getByLabelText("Iteration Limit")).toHaveValue(10000);
    expect(screen.getByLabelText("Time to goal")).toHaveValue("0.296");
  });

  test("Changing motors should change change output", async () => {
    await act(async () => {
      render(<Arm />);
    });

    await act(async () => {
      userEvent.clear(screen.getByLabelText("Motor"));
    });

    expect(screen.getByLabelText("Time to goal")).toHaveValue("0.000");

    await act(async () => {
      userEvent.type(screen.getByLabelText("Motor"), "4");
    });

    expect(screen.getByLabelText("Time to goal")).toHaveValue("0.263");
  });

  test("Initial state should change with query string", async () => {
    delete global.window.location;
    global.window = Object.create(window);
    global.window.location = {
      search:
        '?comLength=%7B"s"%3A15%2C"u"%3A"in"%7D&armMass=%7B"s"%3A10%2C"u"%3A"lbs"%7D&' +
        'currentLimit=%7B"s"%3A45%2C"u"%3A"A"%7D&endAngle=%7B"s"%3A86.99999999999993%2C"u"%3A"deg"%7D&' +
        'iterationLimit=11000&motor=%7B"quantity"%3A3%2C"name"%3A"Falcon%20500"%7D&' +
        'ratio=%7B"magnitude"%3A105%2C"ratioType"%3A"Reduction"%7D&startAngle=%7B"s"%3A3%2C"u"%3A"deg"%7D' +
        "&version=1",
    };

    await act(async () => {
      render(<Arm />);
    });

    expect(screen.getByLabelText("Motor")).toHaveValue(3);
    expect(screen.getByLabelText("Ratio")).toHaveValue(105);
    expect(screen.getByLabelText("CoM Distance")).toHaveValue(15);
    expect(screen.getByLabelText("Arm Mass")).toHaveValue(10);
    expect(screen.getByLabelText("Current Limit")).toHaveValue(45);
    expect(screen.getByLabelText("Start Angle")).toHaveValue(3);
    expect(screen.getByLabelText("End Angle")).toHaveValue(87);
    expect(screen.getByLabelText("Iteration Limit")).toHaveValue(11000);
    expect(screen.getByLabelText("Time to goal")).toHaveValue("0.243");
  });

  test("Render sets title", async () => {
    await act(async () => {
      render(<Arm />);
    });

    expect(global.window.document.title).toBe("ReCalc - Arm Calculator");
  });
});
