import { isObjectLike } from "lodash";
import Measurement from "../models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import Model from "./Model";

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

export const sendToWorker = (obj) => {
  if (obj instanceof Model) {
    return {
      ...obj.toDict(),
      constructorId: constructors.indexOf(obj.constructor),
    };
  } else if (Array.isArray(obj)) {
    return obj.map((a) => sendToWorker(a));
  } else if (isObjectLike(obj)) {
    return Object.keys(obj).reduce((acc, key) => {
      return {
        ...acc,
        [key]: sendToWorker(obj[key]),
      };
    }, {});
  } else {
    return obj;
  }
};

export const receiveFromMain = (obj) => {
  if (obj.hasOwnProperty("constructorId")) {
    return constructors[obj.constructorId].fromDict(obj);
  } else if (Array.isArray(obj)) {
    return obj.map((a) => receiveFromMain(a));
  } else if (isObjectLike(obj)) {
    return Object.keys(obj).reduce((acc, key) => {
      return {
        ...acc,
        [key]: receiveFromMain(obj[key]),
      };
    }, {});
  } else {
    return obj;
  }
};
