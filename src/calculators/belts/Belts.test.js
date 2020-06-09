import { render } from "@testing-library/react";
import React from "react";
import { TestingProvider } from "tests/TestStoreProvider";

import Belts from "./Belts";

test("Belts calc shows input fields", () => {
  render(
    <TestingProvider>
      <Belts title="Belt calculator" />
    </TestingProvider>
  );
});
