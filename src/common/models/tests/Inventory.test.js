import Measurement from "common/models/Measurement";
import { GoogleSpreadsheet } from "google-spreadsheet";

import { VBeltGuysInventory } from "../Inventory";

describe("Inventory", () => {
  describe("VBeltGuysInventory", () => {
    test.each([
      {
        teeth: 200,
        pitch: new Measurement(3, "mm"),
        width: new Measurement(9, "mm"),
        url: "https://www.vbeltguys.com/products/600-3m-09-synchronous-timing-belt",
      },
      {
        teeth: 100,
        pitch: new Measurement(3, "mm"),
        width: new Measurement(15, "mm"),
        url: "https://www.vbeltguys.com/products/300-3m-15-synchronous-timing-belt",
      },
      {
        teeth: 100,
        pitch: new Measurement(3, "mm"),
        width: new Measurement(9, "mm"),
        url: "https://www.vbeltguys.com/products/300-3m-09-synchronous-timing-belt",
      },
    ])("objToUrl", ({ teeth, pitch, width, url }) => {
      expect(new VBeltGuysInventory().objToUrl({ teeth, pitch, width })).toBe(
        url
      );
    });

    test.each([
      {
        teeth: 200,
        pitch: new Measurement(3, "mm"),
        width: new Measurement(9, "mm"),
        array: [
          "200",
          "3 mm",
          "9 mm",
          "https://www.vbeltguys.com/products/600-3m-09-synchronous-timing-belt",
        ],
      },
      {
        teeth: 100,
        pitch: new Measurement(3, "mm"),
        width: new Measurement(15, "mm"),
        array: [
          "100",
          "3 mm",
          "15 mm",
          "https://www.vbeltguys.com/products/300-3m-15-synchronous-timing-belt",
        ],
      },
      {
        teeth: 100,
        pitch: new Measurement(3, "mm"),
        width: new Measurement(9, "mm"),
        array: [
          "100",
          "3 mm",
          "9 mm",
          "https://www.vbeltguys.com/products/300-3m-09-synchronous-timing-belt",
        ],
      },
    ])("objToArray", ({ teeth, pitch, width, array }) => {
      expect(
        new VBeltGuysInventory().objToArray({ teeth, pitch, width })
      ).toEqual(array);
    });

    test.each([
      {
        teeth: 200,
        pitch: new Measurement(3, "mm"),
        width: new Measurement(9, "mm"),
        shouldWrite: true,
      },
      {
        teeth: 100,
        pitch: new Measurement(3, "mm"),
        width: new Measurement(15, "mm"),
        shouldWrite: true,
      },
      {
        teeth: 100,
        pitch: new Measurement(5, "mm"),
        width: new Measurement(9, "mm"),
        shouldWrite: true,
      },
      {
        teeth: 100,
        pitch: new Measurement(4, "mm"),
        width: new Measurement(15, "mm"),
        shouldWrite: false,
      },
      {
        teeth: 100,
        pitch: new Measurement(1, "mm"),
        width: new Measurement(9, "mm"),
        shouldWrite: false,
      },
    ])("shouldWrite", ({ teeth, pitch, width, shouldWrite }) => {
      expect(
        new VBeltGuysInventory().shouldWrite({ teeth, pitch, width })
      ).toBe(shouldWrite);
    });

    test("scanInventory", () => {
      const data = [
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
        inventoryData: data,
        allowAuth: false,
      });
      expect(
        inventory.scanInventory({
          teeth: 100,
          pitch: new Measurement(3, "mm"),
          width: new Measurement(9, "mm"),
        })
      ).toMatchObject({
        found: true,
        has: true,
      });

      expect(
        inventory.scanInventory({
          teeth: 200,
          pitch: new Measurement(5, "mm"),
          width: new Measurement(15, "mm"),
        })
      ).toMatchObject({
        found: true,
        has: false,
      });

      expect(
        inventory.scanInventory({
          teeth: 150,
          pitch: new Measurement(5, "mm"),
          width: new Measurement(15, "mm"),
        })
      ).toMatchObject({
        found: false,
        has: undefined,
      });
    });

    test("Constructor", () => {
      const inv = new VBeltGuysInventory({ allowAuth: false });
      expect(inv.name).toBe("VBeltGuys");
      expect(inv.spreadsheetId).toBe(
        "1po6dM_EVEPVecRIrvq-ThEfvFDRg-OO6uI9emKdDuqI"
      );
      expect(inv.inventoryData).toHaveLength(358);
      expect(inv.allowAuth).toBeFalsy();
      expect(inv.worksheetName).toBe("VBeltGuys_test");
      expect(inv.worksheet).toBeUndefined();
      expect(inv.allRows).toEqual([]);
      expect(inv.googleSpreadsheet).toBeInstanceOf(GoogleSpreadsheet);
    });

    test("Writes to sheet", async () => {
      const inv = new VBeltGuysInventory();
      expect(inv.worksheetName).toBe("VBeltGuys_test");

      await inv.writeToSheet(
        inv.objToArray({
          teeth: 200,
          pitch: new Measurement(5, "mm"),
          width: new Measurement(15, "mm"),
        })
      );
    });
  });
});
