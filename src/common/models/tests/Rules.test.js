import Rules from "common/models/Rules";

describe("Rules", () => {
  test("addRule sorts by priority, high number being more prioritized", () => {
    const rules = new Rules();

    [
      {
        name: "1",
        conditionFn: () => {},
        modifyFn: () => {},
        haltAfter: false,
        priority: 1,
      },
      {
        name: "2",
        conditionFn: () => {},
        modifyFn: () => {},
        haltAfter: false,
        priority: 2,
      },
      {
        name: "3",
        conditionFn: () => {},
        modifyFn: () => {},
        haltAfter: false,
        priority: 3,
      },
      {
        name: "4",
        conditionFn: () => {},
        modifyFn: () => {},
        haltAfter: false,
        priority: 4,
      },
    ].forEach((r) => {
      rules.addRule(r.name, r.conditionFn, r.modifyFn, r.haltAfter, r.priority);
    });

    expect(rules.rules).toHaveLength(4);
    expect(rules.rules[0].priority).toEqual(4);
    expect(rules.rules[1].priority).toEqual(3);
    expect(rules.rules[2].priority).toEqual(2);
    expect(rules.rules[3].priority).toEqual(1);

    expect(rules.rules[0].name).toEqual("4");
  });

  test("Terminates with basic counter", () => {
    const cbs = [
      {
        conditionFn: jest.fn((s) => s.counter < 5),
        modifyFn: jest.fn((s) => {
          s.counter++;
        }),
      },
      {
        conditionFn: jest.fn((s) => s.counter == 5),
        modifyFn: jest.fn(() => {}),
      },
    ];

    const rules = new Rules();
    [
      {
        name: "Increment",
        conditionFn: cbs[0].conditionFn,
        modifyFn: cbs[0].modifyFn,
        haltAfter: false,
      },
      {
        name: "Halt",
        conditionFn: cbs[1].conditionFn,
        modifyFn: cbs[1].modifyFn,
        haltAfter: true,
      },
    ].forEach((r) => {
      rules.addRule(r.name, r.conditionFn, r.modifyFn, r.haltAfter);
    });

    const obj = { counter: 0 };
    rules.solve(obj);

    expect(cbs[0].conditionFn.mock.calls.length).toEqual(6);
    expect(cbs[0].modifyFn.mock.calls.length).toEqual(5);
    expect(cbs[1].conditionFn.mock.calls.length).toEqual(1);
    expect(cbs[1].modifyFn.mock.calls.length).toEqual(1);
    expect(obj).toEqual({ counter: 5 });
  });

  test("Terminates with odd priorities", () => {
    const cbs = [
      {
        conditionFn: jest.fn((s) => s.counter < 5),
        modifyFn: jest.fn((s) => {
          s.counter++;
        }),
      },
      {
        conditionFn: jest.fn((s) => s.counter == 5),
        modifyFn: jest.fn(() => {}),
      },
    ];

    const rules = new Rules();
    [
      {
        name: "Increment",
        conditionFn: cbs[0].conditionFn,
        modifyFn: cbs[0].modifyFn,
        haltAfter: false,
        priority: 1,
      },
      {
        name: "Halt",
        conditionFn: cbs[1].conditionFn,
        modifyFn: cbs[1].modifyFn,
        haltAfter: true,
        priority: 2,
      },
    ].forEach((r) => {
      rules.addRule(r.name, r.conditionFn, r.modifyFn, r.haltAfter, r.priority);
    });

    const obj = { counter: 0 };
    rules.solve(obj);

    expect(cbs[0].conditionFn.mock.calls.length).toEqual(5);
    expect(cbs[0].modifyFn.mock.calls.length).toEqual(5);
    expect(cbs[1].conditionFn.mock.calls.length).toEqual(6);
    expect(cbs[1].modifyFn.mock.calls.length).toEqual(1);
    expect(obj).toEqual({ counter: 5 });
  });
});
