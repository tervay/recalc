import { NotImplementedError } from "common/tooling/errors";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { isEqual } from "lodash";
import wretch from "wretch";
import Measurement from "common/models/Measurement";

import vBeltGuysInventoryJson from "common/models/data/vBeltGuysInventoryData.json";

// const allowAuth =
//   process.env.NODE_ENV !== "test" && !process.env.REACT_APP_SKIP_GAUTH;

export default class Inventory {
  constructor(name, spreadsheetId, inventoryData, allowAuth = true) {
    if (new.target === Inventory) {
      throw new TypeError("Cannot instantiate base class Inventory directly");
    }

    this.name = name;
    this.spreadsheetId = spreadsheetId;
    this.inventoryData = inventoryData;
    this.allowAuth = allowAuth && !process.env.REACT_APP_SKIP_GAUTH;

    this.worksheetName = `${name}_${process.env.NODE_ENV}`;
    this.worksheet = undefined;
    this.allRows = [];
    this.googleSpreadsheet = new GoogleSpreadsheet(spreadsheetId);

    if (allowAuth) {
      this.authenticateServiceAccount()
        .then(() => this.googleSpreadsheet.loadInfo())
        .then(async () => {
          this.worksheet =
            this.googleSpreadsheet.sheetsByTitle[this.worksheetName];
        });
    }
  }

  objToUrl(obj) {
    throw new NotImplementedError("Inventory should implement objToUrl!");
  }

  shouldWrite(obj) {
    throw new NotImplementedError("Inventory should implement shouldWrite!");
  }

  objToArray(obj) {
    throw new NotImplementedError("Inventory should implement objToArray!");
  }

  async authenticateServiceAccount() {
    await this.googleSpreadsheet.useServiceAccountAuth({
      client_email: process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.REACT_APP_GOOGLE_PRIVATE_KEY,
    });
  }

  scanInventory(obj) {
    const url = this.objToUrl(obj);
    let result = { found: false, has: undefined };

    this.inventoryData.forEach((item) => {
      if (item.generatedUrl === url) {
        result = { found: true, has: Number(item.responseCode) === 200 };
      }
    });

    return result;
  }

  async writeToSheet(arr) {
    try {
      this.allRows = await this.worksheet.getRows();
    } catch (e) {
      console.log("Rate limited on gSheets reads ", e);
    }

    if (this.allRows.filter((row) => isEqual(row._rawData, arr)).length === 0) {
      try {
        await this.worksheet.addRow(arr);
      } catch (_) {
        console.log("Rate limited on gSheets writes");
      }
    }
  }

  checkInventory(obj) {
    if (!allowAuth) {
      return;
    }

    const url = this.objToUrl(obj).generatedUrl;
    if (this.shouldWrite(obj)) {
      wretch(url)
        .get()
        .notFound((_) => {
          this.writeToSheet([...this.objToArray(obj), 404]);
        })
        .res((_) => {
          this.writeToSheet([...this.objToArray(obj), 200]);
        });
    }
  }
}

export class VBeltGuysInventory extends Inventory {
  constructor({
    inventoryData = vBeltGuysInventoryJson,
    allowAuth = true,
  } = {}) {
    super(
      "VBeltGuys",
      "1po6dM_EVEPVecRIrvq-ThEfvFDRg-OO6uI9emKdDuqI",
      inventoryData,
      allowAuth
    );
  }

  objToUrl(obj) {
    const length = Math.round(obj.pitch.mul(obj.teeth).to("mm").scalar);
    const zeroPad = (num, places) => String(num).padStart(places, "0");

    return `https://www.vbeltguys.com/products/${length}-${
      obj.pitch.to("mm").scalar
    }m-${zeroPad(
      Number(obj.width.to("mm").scalar.toFixed(2)),
      2
    )}-synchronous-timing-belt`;
  }

  objToArray(obj) {
    return [
      String(obj.teeth),
      obj.pitch.to("mm").format(),
      `${Number(obj.width.to("mm").scalar.toFixed(2))} mm`,
      this.objToUrl(obj),
    ];
  }

  shouldWrite(obj) {
    return (
      obj.pitch.eq(new Measurement(3, "mm")) ||
      obj.pitch.eq(new Measurement(5, "mm"))
    );
  }
}
