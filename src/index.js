import React from "react";
import ReactDOM from "react-dom";
import "bulma/css/bulma.min.css";
import "./index.css";
import store from "./app/store";
import { Provider } from "react-redux";
import * as serviceWorker from "./serviceWorker";
import { BeltCalculator } from "./features/belt_calculator/BeltCalculator";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <QueryParamProvider ReactRouterRoute={Route}>
          {/* This will appear on all pages */}
          <Switch>
            <Route exact path="/">
              landing :)
            </Route>
            <Route path="/belts">
              <BeltCalculator />
            </Route>
          </Switch>
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
