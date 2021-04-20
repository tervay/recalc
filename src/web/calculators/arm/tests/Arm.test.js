import { fireEvent, render, screen, act } from "@testing-library/react";

import Arm from "../Arm";

describe("Arm calculator", () => {
  test("Renders", async () => {
    await act(async () => {
      render(<Arm />);
    });
  });
});
