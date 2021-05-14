import { setTitle } from "common/tooling/routing";
import arm from "web/calculators/arm";
import belts from "web/calculators/belts";
import chains from "web/calculators/chains";
// import dslogs from "web/calculators/dslogs";
import flywheel from "web/calculators/flywheel";
import linear from "web/calculators/linear_mech";
import gearload from "web/calculators/load";
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
        <div
          className="hero-body"
          style={{
            paddingTop: 0,
          }}
        >
          <div className="container">
            <h1 className="title">⎰ReCalc</h1>
            <h2 className="subtitle">
              A collaboration focused mechanical design calculator
            </h2>
          </div>
        </div>
      </section>

      <section
        className="section"
        style={{
          paddingTop: 0,
        }}
      >
        <h1 className="title">Calculators</h1>
        <div className="columns is-multiline is-gapless">
          <div className="column is-half">
            <Tile to={belts.url} title={belts.title} image={belts.image} />
          </div>

          <div className="column is-half">
            <Tile to={chains.url} title={chains.title} image={chains.image} />
          </div>

          <div className="column is-half">
            <Tile
              to={flywheel.url}
              title={flywheel.title}
              image={flywheel.image}
            />
          </div>

          <div className="column is-half">
            <Tile to={linear.url} title={linear.title} image={linear.image} />
          </div>

          <div className={"column is-half"}>
            <Tile to={arm.url} title={arm.title} />
          </div>
          <div className={"column is-half"}>
            <Tile
              to={pneumatics.url}
              title={pneumatics.title}
              image={pneumatics.image}
            />
          </div>

          <div className={"column is-half"}>
            <Tile
              to={gearload.url}
              title={gearload.title}
              image={gearload.image}
            />
          </div>
        </div>
      </section>

      <section
        className="section"
        style={{
          paddingTop: 0,
        }}
      >
        <h1 className="title">Information</h1>
        <div className="columns is-multiline is-gapless">
          <div className="column is-half">
            <Tile
              to={filaments.url}
              title={filaments.title}
              image={filaments.image}
            />
          </div>

          <div className="column is-half">
            <Tile to={motors.url} title={motors.title} image={motors.image} />
          </div>
          <div className="column is-half">
            <Tile
              to={compressors.url}
              title={compressors.title}
              image={compressors.image}
            />
          </div>

          <div className="column is-half">
            <Tile to="/about" title="About ⎰ReCalc" />
          </div>
        </div>
      </section>

      {/* <section className="section">
        <h1 className="title">Utilities</h1>
        <div className="subtitle">
          <div className="columns is-2 is-variable">
            <div className="column is-half">
              <Tile to={dslogs.url} title={dslogs.title} />
            </div>
          </div>
        </div>
      </section> */}
    </>
  );
}
