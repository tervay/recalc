import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  calculateClosestSizesReducer,
  teethToPitchDiameterReducer,
} from "./slice";
import { useQueryParams, withDefault, NumberParam } from "use-query-params";
import { QtyParam } from "../../utils";
import Qty from "js-quantities";
import {
  QtyInput,
  QtyOutput,
  QtyInputCore,
  QtyOutputCore,
} from "../common/QtyFields";
import { NumberOutput, NumberInputCore } from "../common/NumberFields";
import Hero from "../common/hero";
import CheatSheet from "./CheatSheet";
import NumberInQtyOut from "./NumberInQtyOut";

export default function BeltCalculator() {
  // Prepare inputs
  const dispatch = useDispatch();
  const [query, setQuery] = useQueryParams({
    pitch: withDefault(QtyParam, Qty(3, "mm")),
    desiredCenter: withDefault(QtyParam, Qty(5, "in")),
    p1Teeth: withDefault(NumberParam, 24),
    p2Teeth: withDefault(NumberParam, 18),
  });
  const { pitch, desiredCenter, p1Teeth, p2Teeth } = query;

  // Prepare outputs
  const closestSmaller = useSelector((s) => s.beltCalculator.closestSmaller);
  const closestLarger = useSelector((s) => s.beltCalculator.closestLarger);
  const p1PitchDiameter = useSelector((s) => s.beltCalculator.p1PitchDiameter);
  const p2PitchDiameter = useSelector((s) => s.beltCalculator.p2PitchDiameter);

  // Update
  useEffect(() => {
    const state = {
      pitch,
      p1Teeth,
      p2Teeth,
      desiredCenter,
    };

    dispatch(teethToPitchDiameterReducer(state));
    dispatch(calculateClosestSizesReducer(state));
  }, [pitch, p1Teeth, p2Teeth, desiredCenter]);

  return (
    <div>
      <Hero title="Belt Calculator" />
      <div className="columns">
        <div className="column">
          <QtyInput
            label="Tooth Pitch"
            name="pitch"
            qty={pitch}
            setQuery={setQuery}
            choices={["mm", "in"]}
          />

          <NumberInQtyOut
            label={"Teeth / PD"}
            input={
              <NumberInputCore
                name="p1Teeth"
                number={p1Teeth}
                setQuery={setQuery}
              />
            }
            output={
              <QtyOutputCore
                qty={p1PitchDiameter}
                choices={["in", "mm"]}
                precision={3}
                redIf={() =>
                  p1PitchDiameter.scalar === 0 || p1PitchDiameter.scalar < 0
                }
              />
            }
          />

          <NumberInQtyOut
            label={"Teeth / PD"}
            input={
              <NumberInputCore
                name="p2Teeth"
                number={p2Teeth}
                setQuery={setQuery}
              />
            }
            output={
              <QtyOutputCore
                qty={p2PitchDiameter}
                choices={["in", "mm"]}
                precision={3}
                redIf={() =>
                  p2PitchDiameter.scalar === 0 || p2PitchDiameter.scalar < 0
                }
              />
            }
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
            redIf={() =>
              closestSmaller.distance.scalar === 0 ||
              closestSmaller.distance.scalar < 0
            }
          />

          <NumberOutput
            label="Smaller Belt Teeth"
            number={closestSmaller.teeth}
            precision={0}
          />

          <QtyOutput
            label="Larger Center"
            qty={closestLarger.distance}
            choices={["in", "mm"]}
            precision={3}
            redIf={() =>
              closestLarger.distance.scalar === 0 ||
              closestLarger.distance.scalar < 0
            }
          />

          <NumberOutput
            label="Larger Belt Teeth"
            number={closestLarger.teeth}
            precision={0}
          />
        </div>
        <div className="column">
          <CheatSheet />
        </div>
      </div>
    </div>
  );
}
