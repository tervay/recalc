import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { calculateClosestSizesReducer } from "./slice";
import { useQueryParams, withDefault } from "use-query-params";
import { QtyParam, useDeepCompare } from "../../utils";
import Qty from "js-quantities";
import { QtyInput, QtyOutput } from "../QtyInputs";

export function BeltCalculator() {
  // Prepare inputs
  const dispatch = useDispatch();
  const [query, setQuery] = useQueryParams({
    p1PitchDiameter: withDefault(QtyParam, Qty(0.601, "in")),
    p2PitchDiameter: withDefault(QtyParam, Qty(0.456, "in")),
    desiredCenter: withDefault(QtyParam, Qty(5, "in")),
  });
  const { p1PitchDiameter, p2PitchDiameter, desiredCenter } = query;

  // Prepare outputs
  const closestSmaller = useSelector((s) => s.beltCalculator.closestSmaller);

  // Update
  useEffect(() => {
    const state = {
      p1PitchDiameter,
      p2PitchDiameter,
      desiredCenter,
    };

    dispatch(calculateClosestSizesReducer(state));
  }, [p1PitchDiameter, p2PitchDiameter, desiredCenter]);

  return (
    <div>
      <div>
        <QtyInput
          label="Larger Pitch Diam"
          name="p1PitchDiameter"
          qty={p1PitchDiameter}
          setQuery={setQuery}
          choices={["in", "mm"]}
        />

        <QtyInput
          label="Smaller Pitch Diam"
          name="p2PitchDiameter"
          qty={p2PitchDiameter}
          setQuery={setQuery}
          choices={["in", "mm"]}
        />

        <QtyInput
          label="Desired Center"
          name="desiredCenter"
          qty={desiredCenter}
          setQuery={setQuery}
          choices={["in", "mm"]}
        />

        <QtyOutput
          label="Smaller Center"
          qty={closestSmaller.distance}
          choices={["in", "mm"]}
          precision={3}
          redIf={() => closestSmaller.distance.scalar === 0}
        />
      </div>
    </div>
  );
}
