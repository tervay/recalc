import React from "react";
import Tile from "common/components/landing/Tile";

export default function Landing() {
  return (
    <div>
      <div class="columns">
        <div class="column is-one-third">
          <Tile to="/flywheel" title="Flywheel Calculator" />
        </div>
        <div class="column is-one-third">
          <Tile to="/belts" title="Belt Calculator" />
        </div>
        <div class="column is-one-third">
          <Tile to="/pneumatics" title="Pneumatics Calculator" />
        </div>

        {/* <div class="column">Third column</div>
        <div class="column">Fourth column</div> */}
      </div>
    </div>
  );
}
