import { render } from "@testing-library/react";
import Belts from "calculators/belts/Belts";
import React from "react";
import createStore from "redux-zero";
import { Provider } from "redux-zero/react";

const initialState = { isSignedIn: false, id: null };
const store = createStore(initialState);

function TestingProvider(props) {
  return <Provider store={store}>{props.children}</Provider>;
}

test("test", () => {
  const { getByText } = render(
    <TestingProvider>
      <Belts title="Belt calculator" />
    </TestingProvider>
  );
});
