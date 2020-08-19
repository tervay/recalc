import "index.scss";

import * as Sentry from "@sentry/react";
import App from "App";
import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "serviceWorker";

if (
  !(
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  )
) {
  Sentry.init({
    dsn:
      "https://cd2f25eaeebc44b59f21145d88c63849@o429649.ingest.sentry.io/5376660",
  });
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
