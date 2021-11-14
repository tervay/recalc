import Model from "common/models/Model";
import credentials from "common/tooling/crypto";
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { isEqual } from "lodash";

export type WritableArray = string[];
type ScanResult = {
  readonly found: boolean;
  readonly has?: boolean;
};

export interface InventorySavedResult {
  generatedUrl: string;
  responseCode: number;
}

export type AuthCallback<A extends Model, B extends InventorySavedResult> = (
  i: Inventory<A, B>
) => void;

export default abstract class Inventory<
  PreWriteModel extends Model,
  PostWriteModel extends InventorySavedResult
> {
  public readonly name: string;
  public readonly worksheetName: string;
  private readonly allowAuth: boolean;
  private readonly authCb: AuthCallback<PreWriteModel, PostWriteModel>;
  private readonly spreadsheet: GoogleSpreadsheet;
  private worksheet?: GoogleSpreadsheetWorksheet;
  private readonly offlineData: PostWriteModel[];
  private rows?: GoogleSpreadsheetRow[];

  constructor(
    name: string,
    spreadsheetId: string,
    offlineData: PostWriteModel[],
    allowAuth = true,
    authCallback: AuthCallback<PreWriteModel, PostWriteModel>
  ) {
    this.name = name;
    this.allowAuth = allowAuth;
    this.authCb = authCallback;
    this.offlineData = offlineData;

    this.worksheetName = `${name}_${process.env.NODE_ENV}`;
    this.spreadsheet = new GoogleSpreadsheet(spreadsheetId);
    this.worksheet = undefined;
  }

  didSetupWorksheet(): boolean {
    return this.worksheet !== undefined;
  }

  abstract makeUrl(obj: PreWriteModel): string;
  abstract shouldWrite(obj: PreWriteModel): boolean;
  abstract makeArrayToWrite(obj: PreWriteModel): WritableArray;
  abstract rowToArray(row: GoogleSpreadsheetRow): WritableArray;

  async authenticate(): Promise<void> {
    if (this.allowAuth) {
      this.authenticateServiceAccount()
        .then(() => this.spreadsheet.loadInfo())
        .then(async () => {
          this.worksheet = this.spreadsheet.sheetsByTitle[this.worksheetName];
        })
        .then(() => this.authCb(this));
    }
  }

  async authenticateServiceAccount(): Promise<void> {
    if (credentials === undefined) {
      throw Error(
        "Tried to authenticate service account without env passkey set properly"
      );
    }

    await this.spreadsheet.useServiceAccountAuth({
      client_email: credentials.email,
      private_key: credentials.private_key,
    });
  }

  scanInventory(obj: PreWriteModel): ScanResult {
    const url = this.makeUrl(obj);
    let result: ScanResult = { found: false, has: undefined };
    this.offlineData.forEach((d) => {
      if (d.generatedUrl === url) {
        result = { found: true, has: Number(d.responseCode) === 200 };
      }
    });

    return result;
  }

  async writeToSheet(arr: WritableArray): Promise<void> {
    const rows = await this.getRows();

    try {
      if (
        rows.filter((row) => isEqual(this.rowToArray(row), arr)).length === 0
      ) {
        await this.worksheet?.addRow(arr);
      }
    } catch {
      console.log("Probably rate limited");
    }
  }

  async pingSite(obj: PreWriteModel): Promise<number> {
    if (!this.allowAuth) {
      return new Promise((resolve) => resolve(418));
    }

    const url = this.makeUrl(obj);
    if (this.shouldWrite(obj)) {
      return fetch(url).then((data) => {
        this.writeToSheet([...this.makeArrayToWrite(obj), String(data.status)]);
        return data.status;
      });
    }

    return new Promise((resolve) => resolve(428));
  }

  async getRows(): Promise<GoogleSpreadsheetRow[]> {
    if (this.worksheet === undefined) {
      // throw Error("Did not set up worksheet");
      return new Promise((resolve) => resolve([]));
    }

    try {
      this.rows = await this.worksheet.getRows();
    } catch {
      console.log("probably rate limited on reads");
    }

    return new Promise((resolve) =>
      resolve(this.rows === undefined ? [] : this.rows)
    );
  }
}
