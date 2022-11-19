import { EzDataset } from "common/components/graphing/types";
import MotorPlaygroundList, {
  MotorPlaygroundListDict,
} from "common/models/MotorPlaygroundList";
import { expose } from "common/tooling/promise-worker";
import { NoOp } from "common/tooling/util";

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
self.$RefreshReg$ = NoOp;

export function BuildDatasets(listDict: MotorPlaygroundListDict): EzDataset[] {
  return MotorPlaygroundList.fromDict(listDict).datasets();
}

const workerFunctions = {
  BuildDatasets,
};

expose(workerFunctions);
type PlaygroundWorkerFunctions = typeof workerFunctions;
export type { PlaygroundWorkerFunctions };
