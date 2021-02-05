import { setTitle } from "common/tooling/routing";
import React from "react";
import arm from "web/calculators/arm";
import belts from "web/calculators/belts";
import chains from "web/calculators/chains";
import dslogs from "web/calculators/dslogs";
import flywheel from "web/calculators/flywheel";
import linear from "web/calculators/linear_mech";
import pneumatics from "web/calculators/pneumatics";
import compressors from "web/compressors";
import filaments from "web/filaments";
import Tile from "web/landing/Tile";
import motors from "web/motors";

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

      <section className="section">
        <h1 className="title">Calculators</h1>
        <div className="subtitle">
          <div className="columns">
            <div className="column">
              <Tile to={belts.url} title={belts.title} image={belts.image} />
            </div>

            <div className="column">
              <Tile to={chains.url} title={chains.title} />
            </div>
          </div>

          <div className={"columns"}>
            <div className="column">
              <Tile
                to={flywheel.url}
                title={flywheel.title}
                image={flywheel.image}
              />
            </div>

            <div className="column">
              <Tile to={linear.url} title={linear.title} />
            </div>
          </div>

          <div className={"columns"}>
            <div className={"column"}>
              <Tile to={arm.url} title={arm.title} />
            </div>
            <div className={"column"}>
              <Tile
                to={pneumatics.url}
                title={pneumatics.title}
                image={pneumatics.image}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h1 className="title">Information</h1>
        <div className="subtitle">
          <div className="columns">
            <div className="column">
              <Tile
                to={filaments.url}
                title={filaments.title}
                image={filaments.image}
              />
            </div>

            <div className="column">
              <Tile to={motors.url} title={motors.title} image={motors.image} />
            </div>
            <div className="column">
              <Tile
                to={compressors.url}
                title={compressors.title}
                image={compressors.image}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h1 className="title">Utilities</h1>
        <div className="subtitle">
          <div className="columns">
            <div className="column is-half">
              <Tile to={dslogs.url} title={dslogs.title} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
