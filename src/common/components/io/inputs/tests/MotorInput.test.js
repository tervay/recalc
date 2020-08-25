import { mount } from "enzyme";
import React from "react";
import { TestingProvider } from "tests/TestStoreProvider";

import { motorMap } from "../../../../tooling/motors";
import { UnlabeledMotorInput } from "../MotorInput";

describe("UnlabeledMotorInput test", () => {
  test("updates state hook on change event", () => {
    let foo = {
      quantity: 1,
      data: motorMap["Falcon 500"],
    };
    let setFoo = (n) => {
      foo = n;
    };

    const wrapper = mount(
      <TestingProvider>
        <UnlabeledMotorInput
          stateHook={[foo, setFoo]}
          inputId={"input"}
          selectId={"select"}
          choices={Object.keys(motorMap)}
        />
      </TestingProvider>
    );

    expect(wrapper.find("#input").first().props().value).toBe(1);
    expect(wrapper.find("#select").first().props().value).toBe("Falcon 500");

    wrapper
      .find("#select")
      .simulate("change", { target: { value: "NEO 550" } });
    expect(wrapper.find("#select").first().props().value).toBe("NEO 550");
    expect(foo.data.name).toBe("NEO 550");
    expect(foo.quantity).toBe(1);

    wrapper.find("#input").simulate("change", { target: { value: 4 } });
    expect(wrapper.find("#input").first().props().value).toBe(4);
    expect(foo.data.name).toBe("NEO 550");
    expect(foo.quantity).toBe(4);
  });
});
