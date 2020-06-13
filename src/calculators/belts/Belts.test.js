import Enzyme, { mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import each from "jest-each";
import React from "react";
import { TestingProvider } from "tests/TestStoreProvider";

import Belts from "./Belts";
import { initialState } from "./config";
import { teethToPD } from "./math";

Enzyme.configure({ adapter: new Adapter() });

const wrapper = mount(
  <TestingProvider>
    <Belts />
  </TestingProvider>
);

function setFieldTo(cls, val) {
  wrapper.find(cls).simulate("change", { target: { value: val } });
}

describe("Initial render", () => {
  each([
    ["#pitch-input", initialState.pitch.scalar],
    ["#pitch-select", initialState.pitch.units()],
    ["#desired-center-input", initialState.desiredCenter.scalar],
    ["#desired-center-select", initialState.desiredCenter.units()],
    ["#extra-center-input", initialState.extraCenter.scalar],
    ["#extra-center-select", initialState.extraCenter.units()],
    ["#p1Teeth-input", initialState.p1Teeth],
    ["#p2Teeth-input", initialState.p2Teeth],
  ]).test("shows initial state in HTML input fields", (id, expectedVal) => {
    expect(wrapper.find(id).first().props().value).toBe(expectedVal);
  });

  each([
    [
      "#p1Pitch-input",
      "#p1Pitch-select",
      teethToPD(initialState.p1Teeth, initialState.pitch).to("in"),
    ],
    [
      "#p2Pitch-input",
      "#p2Pitch-select",
      teethToPD(initialState.p2Teeth, initialState.pitch).to("in"),
    ],
  ]).test(
    "correctly shows initial pulley PD for teeth input",
    (inputCls, selectCls, pd) => {
      expect(Number(wrapper.find(inputCls).first().props().value)).toBeCloseTo(
        pd.scalar,
        3
      );
      expect(wrapper.find(selectCls).first().props().value).toBe(pd.units());
    }
  );

  test("correctly calculates center for modified state", () => {
    setFieldTo("#pitch-input", 4);
    setFieldTo("#desired-center-input", 9);
    setFieldTo("#desired-center-select", "cm");
    setFieldTo("#extra-center-input", 1);
    setFieldTo("#extra-center-select", "mm");
    setFieldTo("#p1Teeth-input", 36);
    setFieldTo("#p2Teeth-input", 24);
    setFieldTo("#smaller-select", "mm");
    setFieldTo("#larger-select", "cm");

    const get = (cls) => wrapper.find(cls).first().props().value;

    expect(get("#p1Pitch-input")).toBe("1.8046");
    expect(get("#p2Pitch-input")).toBe("1.2031");
    expect(get("#smaller-input")).toBe("90.7051");
    expect(get("#larger-input")).toBe("10.0738");
    expect(get("#smaller-output")).toBe(75);
    expect(get("#larger-output")).toBe(80);
  });
});
