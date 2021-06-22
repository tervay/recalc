import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import { isObjectLike } from "lodash";

import Measurement from "../models/Measurement";
import Model from "../models/Model";

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

export const objectify = (obj) => {
  if (obj instanceof Model) {
    return {
      ...obj.toDict(),
      constructorId: constructors.indexOf(obj.constructor),
    };
  } else if (Array.isArray(obj)) {
    return obj.map((a) => objectify(a));
  } else if (isObjectLike(obj)) {
    return Object.keys(obj).reduce((acc, key) => {
      return {
        ...acc,
        [key]: objectify(obj[key]),
      };
    }, {});
  } else {
    return obj;
  }
};

export const unobjectify = (obj) => {
  if (Object.prototype.hasOwnProperty.call(obj, "constructorId")) {
    return constructors[obj.constructorId].fromDict(obj);
  } else if (Array.isArray(obj)) {
    return obj.map((a) => unobjectify(a));
  } else if (isObjectLike(obj)) {
    return Object.keys(obj).reduce((acc, key) => {
      return {
        ...acc,
        [key]: unobjectify(obj[key]),
      };
    }, {});
  } else {
    return obj;
  }
};

export const fixFloatingPoint = (n) => {
  return Number(n.toFixed(12));
};
