import { Workerized } from "global";
import * as ArmWorker from "web/calculators/arm/armMath";
import * as LinearWorker from "web/calculators/linear/linearMath";
import * as PneumaticsWorker from "web/calculators/pneumatics/math";
import * as MotorPlaygroundWorker from "web/info/motors/graphBuilder";
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import createArmWorker from "workerize-loader!web/calculators/arm/armMath";
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import createLinearWorker from "workerize-loader!web/calculators/linear/linearMath";
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import createPneumaticsWorker from "workerize-loader!web/calculators/pneumatics/math";
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import createMotorPlaygroundWorker from "workerize-loader!web/info/motors/graphBuilder";

const pneumaticsWorker = createPneumaticsWorker<typeof PneumaticsWorker>();
export const usePneumaticsWorker: () => Workerized<typeof PneumaticsWorker> =
  () => pneumaticsWorker;

const motorPlaygroundWorker =
  createMotorPlaygroundWorker<typeof MotorPlaygroundWorker>();
export const useMotorPlaygroundWorker: () => Workerized<
  typeof MotorPlaygroundWorker
> = () => motorPlaygroundWorker;

const armWorker = createArmWorker<typeof ArmWorker>();
export const useArmWorker: () => Workerized<typeof ArmWorker> = () => armWorker;

const linearWorker = createLinearWorker<typeof LinearWorker>();
export const useLinearWorker: () => Workerized<typeof LinearWorker> = () =>
  linearWorker;
