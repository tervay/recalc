export const isLocalhost = () =>
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const getDate = () => new Date().toISOString();

export const uuid = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);
