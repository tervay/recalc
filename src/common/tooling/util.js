/**
 *
 * @returns {boolean}
 */
import Measurement from "../models/Measurement";
import Motor from "../models/Motor";
import Ratio from "../models/Ratio";

export const isLocalhost = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

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
      return { ...acc, [key]: args[key] };
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
  const isObject = (v) => v !== null && typeof v === "object";

  return Object.keys(args).reduce((acc, key) => {
    if (!isObject(args[key])) {
      return { ...acc, [key]: args[key] };
    }

    const dict = args[key];
    const cls = constructors[dict.constructorId];
    return { ...acc, [key]: cls.fromDict(dict) };
  }, {});
};
