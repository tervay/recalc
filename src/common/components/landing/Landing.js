import { IMAGE as beltImage, URL as beltsURL } from "calculators/belts/config";
import { URL as chainsURL } from "calculators/chains/config";
import {
  IMAGE as flywheelImage,
  URL as flywheelURL,
} from "calculators/flywheel/config";
import { URL as linearURL } from "calculators/linear_mech/config";
import {
  IMAGE as pneumaticsImage,
  URL as pneumaticsURL,
} from "calculators/pneumatics/config";
import Tile from "common/components/landing/Tile";
import { setTitle } from "common/tooling/routing";
import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  setTitle(null);

  return (
    <>
      <section className="hero">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">ReCalc</h1>
            <h2 className="subtitle">
              A collaboration focused mechanical design calculator
            </h2>
          </div>
        </div>
      </section>

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
            <Tile
              to={pneumaticsURL}
              title="Pneumatics Calculator"
              image={pneumaticsImage}
            />
          </div>
        </div>

        <div className="columns">
          <div className="column is-one-third">
            <Tile to={linearURL} title="Linear Mechanism Calculator" />
          </div>
          <div className="column is-one-third">
            <Tile to={chainsURL} title="Chain Calculator" />
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
    </>
  );
}
