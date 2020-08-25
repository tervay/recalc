import Enzyme, { mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import React from "react";
import { TestingProvider } from "tests/TestStoreProvider";

import { UnlabeledNumberInput } from "../NumberInput";

describe("UnlabeledNumberInput test", () => {
  test("updates state hook on change event", () => {
    let foo = 5;
    let setFoo = (n) => {
      foo = n;
    };

    const wrapper = mount(
      <TestingProvider>
        <UnlabeledNumberInput stateHook={[foo, setFoo]} inputId={"input"} />
      </TestingProvider>
    );

    expect(wrapper.find("#input").first().props().value).toBe(5);
    wrapper.find("#input").simulate("change", { target: { value: 24 } });
    expect(foo).toBe(24);
    wrapper.find("#input").simulate("change", { target: { value: 2791 } });
    expect(foo).toBe(2791);
  });
});
