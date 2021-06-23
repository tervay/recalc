import Heading from "common/components/headings/Heading";
import MaterialInput from "common/components/io/inputs/MaterialInput";
import { LabeledMotorInput } from "common/components/io/inputs/MotorInput";
import MultiInputLine from "common/components/io/inputs/MultiInputLine";
import { LabeledNumberInput } from "common/components/io/inputs/NumberInput";
import PressureAngleInput from "common/components/io/inputs/PressureAngleInput";
import { LabeledQtyInput } from "common/components/io/inputs/QtyInput";
import { LabeledRatioInput } from "common/components/io/inputs/RatioInput";
import { LabeledNumberOutput } from "common/components/io/outputs/NumberOutput";
import { LabeledQtyOutput } from "common/components/io/outputs/QtyOutput";
import Metadata from "common/components/Metadata";
import Material from "common/models/Material";
import Measurement from "common/models/Measurement";
import Motor from "common/models/Motor";
import Ratio from "common/models/Ratio";
import {
  QueryableParamHolder,
  queryStringToDefaults,
  stateToQueryString,
} from "common/tooling/query-strings";
import { defaultAssignment } from "common/tooling/versions";
import { useEffect, useState } from "react";
import { NumberParam, StringParam } from "use-query-params";

import config from "./index";
import { calculateState } from "./math";

function calculateFOS(safeLoad, stallLoad) {
  if (stallLoad.scalar === 0) {
    return 0;
  }

  return safeLoad.div(stallLoad).scalar;
}

export default function Load() {
  const {
    motor: motor_,
    planetaryRatio: planetaryRatio_,
    currentLimit: currentLimit_,
    diametralPitch: diametralPitch_,
    pressureAngle: pressureAngle_,
    pinionTeeth: pinionTeeth_,
    gearTeeth: gearTeeth_,
    pinionWidth: pinionWidth_,
    gearWidth: gearWidth_,
    pinionMaterial: pinionMaterial_,
    gearMaterial: gearMaterial_,
  } = queryStringToDefaults(
    window.location.search,
    {
      motor: Motor.getParam(),
      planetaryRatio: Ratio.getParam(),
      currentLimit: Measurement.getParam(),
      diametralPitch: Measurement.getParam(),
      pressureAngle: StringParam,
      pinionTeeth: NumberParam,
      gearTeeth: NumberParam,
      pinionWidth: Measurement.getParam(),
      gearWidth: Measurement.getParam(),
      pinionMaterial: Material.getParam(),
      gearMaterial: Material.getParam(),
    },
    config.initialState,
    defaultAssignment
  );

  // Inputs
  const [motor, setMotor] = useState(motor_);
  const [planetaryRatio, setPlanetaryRatio] = useState(planetaryRatio_);
  const [currentLimit, setCurrentLimit] = useState(currentLimit_);
  const [diametralPitch, setDiametralPitch] = useState(diametralPitch_);
  const [pressureAngle, setPressureAngle] = useState(pressureAngle_);
  const [pressureAngleMeas, setPressureAngleMeas] = useState(
    new Measurement(parseFloat(pressureAngle.slice(0, -1)), "deg")
  );
  const [pinionTeeth, setPinionTeeth] = useState(pinionTeeth_);
  const [pinionMaterial, setPinionMaterial] = useState(pinionMaterial_);
  const [pinionWidth, setPinionWidth] = useState(pinionWidth_);
  const [gearTeeth, setGearTeeth] = useState(gearTeeth_);
  const [gearMaterial, setGearMaterial] = useState(gearMaterial_);
  const [gearWidth, setGearWidth] = useState(gearWidth_);

  // Outputs
  const [pinionSafeLoad, setPinionSafeLoad] = useState(
    new Measurement(1, "lbf")
  );
  const [pinionStallLoad, setPinionStallLoad] = useState(
    new Measurement(1, "lbf")
  );
  const [pinionFOS, setPinionFOS] = useState(
    calculateFOS(pinionSafeLoad, pinionStallLoad)
  );
  const [gearSafeLoad, setGearSafeLoad] = useState(new Measurement(1, "lbf"));
  const [gearStallLoad, setGearStallLoad] = useState(new Measurement(1, "lbf"));
  const [gearFOS, setGearFOS] = useState(
    calculateFOS(gearSafeLoad, gearStallLoad)
  );

  useEffect(() => {
    const state = calculateState(
      motor,
      planetaryRatio,
      currentLimit,
      diametralPitch,
      pressureAngleMeas,
      pinionTeeth,
      pinionMaterial,
      gearTeeth,
      gearMaterial,
      pinionWidth,
      gearWidth
    );

    setPinionSafeLoad(state.pinion.safeLoad);
    setPinionStallLoad(state.pinion.stallForce);
    setGearSafeLoad(state.gear.safeLoad);
    setGearStallLoad(state.gear.stallForce);
  }, [
    motor,
    planetaryRatio,
    currentLimit,
    diametralPitch,
    pressureAngleMeas,
    pinionTeeth,
    pinionMaterial,
    gearTeeth,
    gearMaterial,
    pinionWidth,
    gearWidth,
  ]);

  useEffect(() => {
    setPressureAngleMeas(
      new Measurement(parseFloat(pressureAngle.slice(0, -1)), "deg")
    );
  }, [pressureAngle]);

  useEffect(() => {
    setPinionFOS(calculateFOS(pinionSafeLoad, pinionStallLoad));
  }, [pinionStallLoad, pinionSafeLoad]);
  useEffect(() => {
    setGearFOS(calculateFOS(gearSafeLoad, gearStallLoad));
  }, [gearStallLoad, gearSafeLoad]);

  return (
    <>
      <Metadata config={config} />
      <Heading
        title={config.title}
        subtitle={`V${config.version}`}
        getQuery={() => {
          return stateToQueryString([
            new QueryableParamHolder({ version: config.version }, NumberParam),
            new QueryableParamHolder({ motor }, Motor.getParam()),
            new QueryableParamHolder({ planetaryRatio }, Ratio.getParam()),
            new QueryableParamHolder({ currentLimit }, Measurement.getParam()),
            new QueryableParamHolder(
              { diametralPitch },
              Measurement.getParam()
            ),
            new QueryableParamHolder({ pressureAngle }, StringParam),
            new QueryableParamHolder({ pinionTeeth }, NumberParam),
            new QueryableParamHolder({ pinionMaterial }, Material.getParam()),
            new QueryableParamHolder({ gearTeeth }, NumberParam),
            new QueryableParamHolder({ gearMaterial }, Material.getParam()),
            new QueryableParamHolder({ pinionWidth }, Measurement.getParam()),
            new QueryableParamHolder({ gearWidth }, Measurement.getParam()),
          ]);
        }}
      />
      <div className="columns">
        <div className="column">
          <LabeledMotorInput
            inputId="motors"
            stateHook={[motor, setMotor]}
            label={"Motor"}
            choices={Motor.getAllMotors().map((m) => m.name)}
          />
          <LabeledRatioInput
            label="Planetary Ratio"
            stateHook={[planetaryRatio, setPlanetaryRatio]}
          />
          <LabeledQtyInput
            inputId="currentLimit"
            stateHook={[currentLimit, setCurrentLimit]}
            label="Current Limit"
            choices={["A"]}
          />
          <LabeledQtyInput
            inputId="diametralPitch"
            stateHook={[diametralPitch, setDiametralPitch]}
            label="Diametral Pitch"
            choices={["1/in"]}
          />
          <PressureAngleInput stateHook={[pressureAngle, setPressureAngle]} />
          <MultiInputLine label="Pinion(s)">
            <LabeledNumberInput
              inputId="pinionTeeth"
              stateHook={[pinionTeeth, setPinionTeeth]}
              label="Teeth"
            />
            <MaterialInput
              label="Material"
              selectId="pinionMaterial"
              stateHook={[pinionMaterial, setPinionMaterial]}
            />
            <LabeledQtyInput
              stateHook={[pinionWidth, setPinionWidth]}
              choices={["in"]}
              label="Width"
              inputId="pinionWidth"
            />
          </MultiInputLine>
          <MultiInputLine label="Driven Gear">
            <LabeledNumberInput
              inputId="gearTeeth"
              stateHook={[gearTeeth, setGearTeeth]}
              label="Teeth"
            />
            <MaterialInput
              label="Material"
              stateHook={[gearMaterial, setGearMaterial]}
              selectId="gearMaterial"
            />
            <LabeledQtyInput
              stateHook={[gearWidth, setGearWidth]}
              choices={["in"]}
              label="Width"
              inputId="gearWidth"
            />
          </MultiInputLine>
          <LabeledQtyOutput
            stateHook={[pinionSafeLoad, setPinionSafeLoad]}
            choices={["lbf", "N"]}
            label={"Pinion Safe Load"}
            precision={3}
          />
          <LabeledQtyOutput
            stateHook={[pinionStallLoad, setPinionStallLoad]}
            choices={["lbf", "N"]}
            label={"Pinion Stall Load"}
            precision={3}
          />
          <LabeledNumberOutput
            stateHook={[pinionFOS, setPinionFOS]}
            label="Pinion Factor of Safety"
            precision={3}
          />
          <LabeledQtyOutput
            stateHook={[gearSafeLoad, setGearSafeLoad]}
            choices={["lbf", "N"]}
            label={"Driven Gear Safe Load"}
            precision={3}
          />
          <LabeledQtyOutput
            stateHook={[gearStallLoad, setGearStallLoad]}
            choices={["lbf", "N"]}
            label={"Driven Gear Stall Load"}
            precision={3}
          />
          <LabeledNumberOutput
            stateHook={[gearFOS, setGearFOS]}
            label="Driven Gear Factor of Safety"
            precision={3}
          />
        </div>
        <div className="column">
          <article className="message is-warning">
            <div className="message-header">
              <p>Warning</p>
            </div>
            <div className="message-body">
              This calculator uses some questionable regression math in order to
              estimate Lewis Y factors. Please take results from this calculator
              with a grain of salt. This math is not perfect, it exists just for
              estimating factors of safety.
              <br />
              <br />
              Additionally, the field of material science has many different
              tests & specifications for different materials and their
              properties, and some data is imperfectly extrapolated from other
              tests.
              <br />
              <br />
              This calculator assumes the pinion is attached directly to the
              motor output shaft, and that each motor has a pinion together
              driving a single gear.
              <br />
              <br />
              For the planetary ratio, it assumes only a single motor is driving
              each planetary, and the number of planetaries is equal to the
              number of motors. The pinion is attached to the planetary output
              shaft.
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
