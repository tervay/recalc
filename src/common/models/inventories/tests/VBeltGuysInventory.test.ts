import Belt from "common/models/Belt";
import { mm } from "common/models/ExtraTypes";
import VBeltGuysInventory, {
  VBeltGuysResult,
} from "common/models/inventories/VBeltGuysInventory";
import { NoOp } from "common/tooling/util";
import { describe, expect, test, vi } from "vitest";

describe("VBeltGuysInventory", () => {
  test.each([
    {
      belt: Belt.fromTeeth(200, mm(3), mm(9)),
      url: "https://www.vbeltguys.com/products/600-3m-09-synchronous-timing-belt",
    },
    {
      belt: Belt.fromTeeth(100, mm(3), mm(15)),
      url: "https://www.vbeltguys.com/products/300-3m-15-synchronous-timing-belt",
    },
    {
      belt: Belt.fromTeeth(100, mm(3), mm(9)),
      url: "https://www.vbeltguys.com/products/300-3m-09-synchronous-timing-belt",
    },
  ])(
    "objToUrl",
    ({ belt, url }) => {
      expect(new VBeltGuysInventory().makeUrl(belt)).toEqual(url);
    },
    { timeout: 20 * 1000 }
  );

  test.each([
    {
      belt: Belt.fromTeeth(200, mm(3), mm(9)),
      array: [
        "200",
        "3 mm",
        "9 mm",
        "https://www.vbeltguys.com/products/600-3m-09-synchronous-timing-belt",
      ],
    },
    {
      belt: Belt.fromTeeth(100, mm(3), mm(15)),
      array: [
        "100",
        "3 mm",
        "15 mm",
        "https://www.vbeltguys.com/products/300-3m-15-synchronous-timing-belt",
      ],
    },
    {
      belt: Belt.fromTeeth(100, mm(3), mm(9)),
      array: [
        "100",
        "3 mm",
        "9 mm",
        "https://www.vbeltguys.com/products/300-3m-09-synchronous-timing-belt",
      ],
    },
  ])("objToArray", ({ belt, array }) => {
    expect(new VBeltGuysInventory().makeArrayToWrite(belt)).toEqual(array);
  });

  test.each([
    Belt.fromTeeth(200, mm(3), mm(9)),
    Belt.fromTeeth(100, mm(3), mm(15)),
    Belt.fromTeeth(100, mm(5), mm(9)),
  ])("%p should write", (belt) => {
    expect(new VBeltGuysInventory().shouldWrite(belt)).toBeTruthy();
  });

  test.each([
    Belt.fromTeeth(200, mm(4), mm(9)),
    Belt.fromTeeth(100, mm(6), mm(15)),
    Belt.fromTeeth(100, mm(1), mm(9)),
  ])("%p should not write", (belt) => {
    expect(new VBeltGuysInventory().shouldWrite(belt)).toBeFalsy();
  });

  test("scanInventory", () => {
    const data: VBeltGuysResult[] = [
      {
        teeth: 100,
        pitch: "3 mm",
        width: "9 mm",
        generatedUrl:
          "https://www.vbeltguys.com/products/300-3m-09-synchronous-timing-belt",
        responseCode: 200,
      },
      {
        teeth: 200,
        pitch: "5 mm",
        width: "15 mm",
        generatedUrl:
          "https://www.vbeltguys.com/products/1000-5m-15-synchronous-timing-belt",
        responseCode: 404,
      },
    ];

    const inventory = new VBeltGuysInventory({
      offlineData: data,
      allowAuth: false,
      authCb: NoOp,
    });
    expect(
      inventory.scanInventory(Belt.fromTeeth(100, mm(3), mm(9)))
    ).toMatchObject({
      found: true,
      has: true,
    });

    expect(
      inventory.scanInventory(Belt.fromTeeth(200, mm(5), mm(15)))
    ).toMatchObject({
      found: true,
      has: false,
    });

    expect(
      inventory.scanInventory(Belt.fromTeeth(150, mm(5), mm(15)))
    ).toMatchObject({
      found: false,
      has: undefined,
    });
  });

  test.skip("Pings VBG and attempts to write", (done) => {
    const inventory = new VBeltGuysInventory({
      offlineData: [],
      allowAuth: true,
      authCb: async (i) => {
        const spy = vi
          .spyOn(i, "writeToSheet")
          .mockImplementation((_) => new Promise((resolve) => resolve()));

        // expect(i.didSetupWorksheet()).toBeTruthy();
        await i.pingSite(Belt.fromTeeth(200, mm(3), mm(9)));
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenLastCalledWith([
          "200",
          "3 mm",
          "9 mm",
          "https://www.vbeltguys.com/products/600-3m-09-synchronous-timing-belt",
          "200",
        ]);
        // done();
      },
    });

    inventory.authenticate();
  });

  test.skip("Writes to worksheet", (done) => {
    const inv = new VBeltGuysInventory({
      allowAuth: true,
      authCb: async (inventory) => {
        // expect(inventory.didSetupWorksheet()).toBeTruthy();
        await inventory.writeToSheet(["1", "2", "3", "4", "5"]);

        // const rows = await inventory.getRows();
        // expect(rows.length).toBeGreaterThanOrEqual(1);
        // expect(rows[rows.length - 1]).toMatchObject({
        //   Teeth: "1",
        //   Pitch: "2",
        //   Width: "3",
        //   "Generated URL": "4",
        //   "Response Code": "5",
        // });

        // await rows[rows.length - 1].delete();
        // done();
      },
      offlineData: [],
    });

    expect(inv.worksheetName).toBe("VBeltGuys_test");
    inv.authenticate();
  });
});
