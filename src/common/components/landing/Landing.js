import { IMAGE as beltImage, URL as beltsURL } from "calculators/belts/config";
import {
  IMAGE as flywheelImage,
  URL as flywheelURL,
} from "calculators/flywheel/config";
import { URL as linearURL } from "calculators/linear_mech/config";
import { URL as pneumaticsURL } from "calculators/pneumatics/config";
import Tile from "common/components/landing/Tile";
import { setTitle } from "common/tooling/routing";
import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  setTitle(null);

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
            <div className="card">
              <div className="card-content">
                <p className="title">About</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
