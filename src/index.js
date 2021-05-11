import "index.scss";

import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import App from "App";
import { StrictMode } from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "serviceWorker";

if (
  !(
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:"
  )
) {
  Sentry.init({
    dsn: "https://ce7fda8f8fb743a7b733e26823d626c7@o96005.ingest.sentry.io/5588486",
    autoSessionTracking: true,
    integrations: [new Integrations.BrowserTracing()],

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
  });
}

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
