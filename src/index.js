// import "bulma/css/bulma.min.css";
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import store from "./app/store";
import { BeltCalcUrl } from "./features/belt_calculator/BeltCalculator";
import Nav from "./features/common/nav";
import { FlywheelUrl } from "./features/flywheel/Flywheel";
import "./index.scss";
import * as serviceWorker from "./serviceWorker";

const Flywheel = lazy(() => import("./features/flywheel/Flywheel"));
const Landing = lazy(() => import("./features/landing/Landing"));
const BeltCalculator = lazy(() =>
  import("./features/belt_calculator/BeltCalculator")
);

// Render
ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <QueryParamProvider ReactRouterRoute={Route}>
          <Nav />
          <section className="section">
            <div className="container">
              <Suspense fallback={<div>Loading...</div>}>
                <Switch>
                  <Route exact path="/" component={Landing} />
                  <Route path={BeltCalcUrl} component={BeltCalculator} />
                  <Route path={FlywheelUrl} component={Flywheel} />
                </Switch>
              </Suspense>
            </div>
          </section>
        </QueryParamProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
