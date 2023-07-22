import { Result } from "setupTests";

export type IdToElementMap = Record<string, () => HTMLElement>;

const defaultResult: Result = {
  pass: true,
  message: () => "MODIFY ME",
};

export default {
  toAllBeVisible(ids: IdToElementMap): Result {
    Object.entries(ids).map(([_, v]) => {
      // expect(v()).toBeVisible();
    });

    return defaultResult;
  },
  toAllBeEnabled(ids: IdToElementMap): Result {
    Object.entries(ids).map(([_, v]) => {
      // expect(v()).toBeEnabled();
    });

    return defaultResult;
  },
  toAllBeDisabled(ids: IdToElementMap): Result {
    Object.entries(ids).map(([_, v]) => {
      // expect(v()).not.toBeEnabled();
    });

    return defaultResult;
  },
  toAllHaveValue(map: IdToElementMap, value: number): Result {
    Object.entries(map).forEach(([_, getDiv]) => {
      // expect(getDiv()).toHaveValue(value);
    });

    return defaultResult;
  },
  toHaveValues<Map extends IdToElementMap>(
    map: Map,
    expected: { [k in keyof Map]: number },
  ): Result {
    Object.entries(map).forEach(([key, getDiv]) => {
      // expect(getDiv()).toHaveValue(expected[key]);
    });

    return defaultResult;
  },
};
