import Measurement from "common/models/Measurement";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { isEqual } from "lodash";
import wretch from "wretch";

import { MakeVBeltGuysLink } from "./linkGenerator";
import inventoryData from "common/models/data/vBeltGuysInventoryData.json";

const spreadsheetId = "1po6dM_EVEPVecRIrvq-ThEfvFDRg-OO6uI9emKdDuqI";
const doc = new GoogleSpreadsheet(spreadsheetId);
let worksheet = undefined;

const allowAuth =
  process.env.NODE_ENV !== "test" && !process.env.REACT_APP_SKIP_GAUTH;

if (allowAuth) {
  authenticateServiceAccount()
    .then(() => doc.loadInfo())
    .then(async () => {
      worksheet = doc.sheetsByTitle[process.env.NODE_ENV];
    });
}

let allRows = [];

async function authenticateServiceAccount() {
  await doc.useServiceAccountAuth({
    client_email: process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.REACT_APP_GOOGLE_PRIVATE_KEY,
  });
}

function getInventory() {
  return inventoryData;
}

export function scanInventory(url) {
  const inventory = getInventory();

  let result = { found: false, has: undefined };
  inventory.forEach((item) => {
    if (item.generatedUrl === url) {
      result = { found: true, has: Number(item.responseCode) === 200 };
    }
  });

  return result;
}

async function writeToSheet(teeth, pitch, width, url, responseCode) {
  const rowArg = [
    String(teeth),
    pitch.to("mm").format(),
    `${width} mm`,
    url,
    String(responseCode),
  ];

  try {
    allRows = await worksheet.getRows();
  } catch (_) {
    console.log("Rate limited on sheets reads");
  }

  if (allRows.filter((row) => isEqual(row._rawData, rowArg)).length === 0) {
    try {
      await worksheet.addRow(rowArg);
    } catch (_) {
      console.log("Rate limited on sheets writes");
    }
  }
}

export function checkForBelt(teeth, pitch, width) {
  if (!allowAuth) {
    return;
  }

  const url = MakeVBeltGuysLink(teeth, pitch, width);

  if (
    pitch.eq(new Measurement(3, "mm")) ||
    pitch.eq(new Measurement(5, "mm"))
  ) {
    wretch(url)
      .get()
      .notFound((_) => {
        writeToSheet(teeth, pitch, width, url, 404);
      })
      .res((_) => {
        writeToSheet(teeth, pitch, width, url, 200);
      });
  }
}
