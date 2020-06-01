import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Flywheel from "./calculators/flywheel";
import Landing from "./common/components/landing";
import Nav from "./common/components/nav";
import "./index.scss";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Nav />
      <section className="section">
        <div className="container">
          <Suspense fallback={<div>Loading...</div>}>
            <Switch>
              <Route exact path="/" component={Landing} />
              {/* <Route path={BeltCalcUrl} component={BeltCalculator} /> */}
              <Route path="/flywheel" component={Flywheel} />
            </Switch>
          </Suspense>
        </div>
      </section>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
