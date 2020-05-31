// import "bulma/css/bulma.min.css";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import store from "./app/store";
import BeltCalculator, {
  BeltCalcUrl,
} from "./features/belt_calculator/BeltCalculator";
import Nav from "./features/common/nav";
import Flywheel, { FlywheelUrl } from "./features/flywheel/Flywheel";
import Landing from "./features/landing/Landing";
import "./index.scss";
import * as serviceWorker from "./serviceWorker";

// Render
ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <QueryParamProvider ReactRouterRoute={Route}>
          <Nav />
          <section className="section">
            <div className="container">
              <Switch>
                <Route exact path="/">
                  <Landing />
                </Route>
                <Route path={BeltCalcUrl}>
                  <BeltCalculator />
                </Route>
                <Route path={FlywheelUrl}>
                  <Flywheel />
                </Route>
              </Switch>
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
