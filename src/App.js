import "index.scss";

import store from "auth/store";
import { URL as beltsURL } from "calculators/belts/config";
import { URL as chainsURL } from "calculators/chains/config";
import { URL as flywheelURL } from "calculators/flywheel/config";
import { URL as linearURL } from "calculators/linear_mech/config";
import { URL as pneumaticsURL } from "calculators/pneumatics/config";
import Spot from "calculators/spot/Spot";
import Landing from "common/components/landing";
import Nav from "common/components/nav";
import React, { lazy, Suspense } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Provider } from "redux-zero/react";

const LinearMech = lazy(() => import("calculators/linear_mech/LinearMech"));
const Belts = lazy(() => import("calculators/belts/Belts"));
const Flywheel = lazy(() => import("calculators/flywheel/Flywheel"));
const Pneumatics = lazy(() => import("calculators/pneumatics/Pneumatics"));
const About = lazy(() => import("common/components/about/About"));
const Chains = lazy(() => import("calculators/chains/Chains"));
const AuthRedirect = lazy(() => import("auth/AuthRedirect"));

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Nav />
        <section className="section">
          <div className="container">
            <Suspense fallback={<div>Loading...</div>}>
              <Switch>
                <Route exact path="/" component={Landing} />

                <Route path={beltsURL} component={Belts} />
                <Route path={flywheelURL} component={Flywheel} />
                <Route path={pneumaticsURL} component={Pneumatics} />
                <Route path={linearURL} component={LinearMech} />
                <Route path={chainsURL} component={Chains} />

                <Route path={"/about"} component={About} />

                <Route path={"/spot"} component={Spot} />

                <Route path={"/auth"} component={AuthRedirect} />
              </Switch>
            </Suspense>
          </div>
        </section>
      </BrowserRouter>
    </Provider>
  );
}
