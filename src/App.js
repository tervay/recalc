import "index.scss";

import Nav from "common/components/nav/Nav";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Error404 from "web/404";
import arm from "web/calculators/arm";
import belts from "web/calculators/belts";
import chains from "web/calculators/chains";
import dslogs from "web/calculators/dslogs";
import flywheel from "web/calculators/flywheel";
import linear from "web/calculators/linear_mech";
import gearload from "web/calculators/load";
import pneumatics from "web/calculators/pneumatics";
import compressors from "web/compressors";
import filaments from "web/filaments";
import Landing from "web/landing";
import materials from "web/materials";
import motors from "web/motors";

const About = lazy(() => import("web/about/About"));

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <section className="section">
        <div className="container">
          <Suspense
            fallback={
              <progress className="progress is-small is-primary" max="100" />
            }
          >
            <Switch>
              <Route exact path="/" component={Landing} />
              <Route path={belts.url} component={belts.component} />
              <Route path={flywheel.url} component={flywheel.component} />
              <Route path={pneumatics.url} component={pneumatics.component} />
              <Route path={linear.url} component={linear.component} />
              <Route path={chains.url} component={chains.component} />
              <Route path={arm.url} component={arm.component} />
              <Route path={gearload.url} component={gearload.component} />

              <Route path={dslogs.url} component={dslogs.component} />
              <Route path={motors.url} component={motors.component} />
              <Route path={compressors.url} component={compressors.component} />
              <Route path={filaments.url} component={filaments.component} />
              <Route path={materials.url} component={materials.component} />

              <Route path={"/about"} component={About} />
              <Route component={Error404} />
            </Switch>
          </Suspense>
        </div>
      </section>
    </BrowserRouter>
  );
}
