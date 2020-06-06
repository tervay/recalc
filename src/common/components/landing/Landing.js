import React from "react";
import Tile from "common/components/landing/Tile";
import { IMAGE as flywheelImage } from "calculators/flywheel/config";
import { IMAGE as beltImage } from "calculators/belts/config";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div>
      <div className="columns">
        <div className="column is-one-third">
          <Tile
            to="/flywheel"
            title="Flywheel Calculator"
            image={flywheelImage}
          />
        </div>
        <div className="column is-one-third">
          <Tile to="/belts" title="Belt Calculator" image={beltImage} />
        </div>
        <div className="column is-one-third">
          <Tile to="/pneumatics" title="Pneumatics Calculator" />
        </div>
      </div>

      <div className="columns">
        <div className="column is-narrow">
          <Link to="/about">
            <div class="card">
              <div class="card-content">
                <p class="title">About</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
