import store from "auth/store";
import * as belts from "calculators/belts/config";
import * as flywheel from "calculators/flywheel/config";
import * as pneumatics from "calculators/pneumatics/config";
import Landing from "common/components/landing";
import Nav from "common/components/nav";
import "index.scss";
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Provider } from "redux-zero/react";
import * as serviceWorker from "serviceWorker";

const Belts = lazy(() => import("calculators/belts/Belts"));
const Flywheel = lazy(() => import("calculators/flywheel/Flywheel"));
const Pneumatics = lazy(() => import("calculators/pneumatics/Pneumatics"));
const AuthRedirect = lazy(() => import("auth/AuthRedirect"));

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Nav />
        <section className="section">
          <div className="container">
            <Suspense fallback={<div>Loading...</div>}>
              <Switch>
                <Route exact path="/" component={Landing} />
                <Route path={belts.URL} component={Belts} />
                <Route path={flywheel.URL} component={Flywheel} />
                <Route path={pneumatics.URL} component={Pneumatics} />
                <Route path={"/auth"} component={AuthRedirect} />
              </Switch>
            </Suspense>
          </div>
        </section>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
