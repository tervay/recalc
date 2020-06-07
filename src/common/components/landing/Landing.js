import React from "react";
import Tile from "common/components/landing/Tile";
import { IMAGE as flywheelImage } from "calculators/flywheel/config";
import { IMAGE as beltImage } from "calculators/belts/config";
import { Link } from "react-router-dom";

import { URL as beltsURL } from "calculators/belts/config";
import { URL as flywheelURL } from "calculators/flywheel/config";
import { URL as linearURL } from "calculators/linear_mech/config";
import { URL as pneumaticsURL } from "calculators/pneumatics/config";

export default function Landing() {
  return (
    <div>
      <div className="columns">
        <div className="column is-one-third">
          <Tile
            to={flywheelURL}
            title="Flywheel Calculator"
            image={flywheelImage}
          />
        </div>
        <div className="column is-one-third">
          <Tile to={beltsURL} title="Belt Calculator" image={beltImage} />
        </div>
        <div className="column is-one-third">
          <Tile to={pneumaticsURL} title="Pneumatics Calculator" />
        </div>
      </div>

      <div className="columns">
        <div className="column is-one-third">
          <Tile to={linearURL} title="Linear Mechanism Calculator" />
        </div>

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
