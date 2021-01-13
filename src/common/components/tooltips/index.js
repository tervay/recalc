import EN from "./strings/EN";

export const toolTipForIds = (...ids) => {
  for (const id of ids) {
    const tip = toolTipForId(id);
    if (tip) {
      return tip;
    }
  }
  if (process.env.NODE_ENV === "development") {
    console.debug(`Tooltip not found for ${ids.join("|")}`);
  }
  return null;
};

const toolTipForId = (id) => {
  const toolTip = EN[id];
  if (toolTip) {
    return toolTip;
  }
  return null;
};
