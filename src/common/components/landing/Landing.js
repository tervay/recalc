import React from "react";
import Tile from "common/components/landing/Tile";
import { IMAGE as flywheelImage } from "calculators/flywheel/config";
import {IMAGE as beltImage} from "calculators/belts/config"

export default function Landing() {
  return (
    <div>
      <div class="columns">
        <div class="column is-one-third">
          <Tile
            to="/flywheel"
            title="Flywheel Calculator"
            image={flywheelImage}
          />
        </div>
        <div class="column is-one-third">
          <Tile to="/belts" title="Belt Calculator" image={beltImage}/>
        </div>
        <div class="column is-one-third">
          <Tile to="/pneumatics" title="Pneumatics Calculator" />
        </div>
      </div>
    </div>
  );
}
