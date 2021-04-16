import { isObjectLike } from "lodash";
import Measurement from "../models/Measurement";
import Motor from "../models/Motor";
import Ratio from "../models/Ratio";

/**
 *
 * @returns {boolean}
 */
export const isLocalhost = (hostname = window.location.hostname) =>
  ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", ""].includes(hostname) ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.0.") ||
  hostname.endsWith(".local");

/**
 *
 * @returns {string}
 */
export const getDate = () => new Date().toISOString();

/**
 *
 * @returns {string}
 */
export const uuid = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

export const constructors = [Motor, Ratio, Measurement];

export const sendToWorker = (args) => {
  return Object.keys(args).reduce((acc, key) => {
    if (constructors.indexOf(args[key].constructor) === -1) {
      if (isObjectLike(args[key])) {
        return {
          ...acc,
          [key]: sendToWorker(args[key]),
        };
      } else {
        return { ...acc, [key]: args[key] };
      }
    }

    let val = args[key].toDict();
    val["constructorId"] = constructors.indexOf(args[key].constructor);
    return {
      ...acc,
      [key]: val,
    };
  }, {});
};

export const receiveFromMain = (args) => {
  return Object.keys(args).reduce((acc, key) => {
    if (!isObjectLike(args[key])) {
      return { ...acc, [key]: args[key] };
    }

    const dict = args[key];
    if ("constructorId" in dict) {
      const cls = constructors[dict.constructorId];
      return { ...acc, [key]: cls.fromDict(dict) };
    } else {
      return { ...acc, [key]: receiveFromMain(dict) };
    }
  }, {});
};
