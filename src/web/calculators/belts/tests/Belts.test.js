import { mount } from "enzyme";
import each from "jest-each";
import React from "react";
import { TestingProvider } from "tests/TestStoreProvider";
import belts from "web/calculators/belts";
import { teethToPD } from "web/calculators/belts/math";

import Belts from "../Belts";

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
    ["#pitch-input", belts.initialState.pitch.scalar],
    ["#pitch-select", belts.initialState.pitch.units()],
    ["#desired-center-input", belts.initialState.desiredCenter.scalar],
    ["#desired-center-select", belts.initialState.desiredCenter.units()],
    ["#extra-center-input", belts.initialState.extraCenter.scalar],
    ["#extra-center-select", belts.initialState.extraCenter.units()],
    ["#p1Teeth-input", belts.initialState.p1Teeth],
    ["#p2Teeth-input", belts.initialState.p2Teeth],
  ]).test("shows initial state in HTML input fields", (id, expectedVal) => {
    expect(wrapper.find(id).first().props().value).toBe(expectedVal);
  });

  each([
    [
      "#p1Pitch-input",
      "#p1Pitch-select",
      teethToPD(belts.initialState.p1Teeth, belts.initialState.pitch).to("in"),
    ],
    [
      "#p2Pitch-input",
      "#p2Pitch-select",
      teethToPD(belts.initialState.p2Teeth, belts.initialState.pitch).to("in"),
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
