import Enzyme, { mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import each from "jest-each";
import React from "react";
import { TestingProvider } from "tests/TestStoreProvider";

import Belts from "./Belts";
import { initialState } from "./config";

Enzyme.configure({ adapter: new Adapter() });

const wrapper = mount(
  <TestingProvider>
    <Belts />
  </TestingProvider>
);

describe("Initial render", () => {
  each([
    ["#pitch-input", initialState.pitch.scalar],
    ["#pitch-select", initialState.pitch.units()],
    ["#desired-center-input", initialState.desiredCenter.scalar],
    ["#desired-center-select", initialState.desiredCenter.units()],
    ["#extra-center-input", initialState.extraCenter.scalar],
    ["#extra-center-select", initialState.extraCenter.units()],
  ]).test("shows in HTML input fields", (id, expectedVal) => {
    expect(wrapper.find(id).first().props().value).toBe(expectedVal);
  });
});
