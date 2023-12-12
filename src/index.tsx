import { dom, library } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import {
  faArrowsAltV,
  faBookmark,
  faCalculator,
  faCheckSquare,
  faCodeBranch,
  faInfoCircle,
  faLink,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { createRoot } from "react-dom/client";
import "scss/index.css";
import "scss/index.scss";
import Routing from "./Routing";
import reportWebVitals from "./reportWebVitals";

dom.watch();
library.add(
  faArrowsAltV,
  faBookmark,
  faCalculator,
  faCheckSquare,
  faCodeBranch,
  faInfoCircle,
  faLink,
  faUsers,
);

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Routing />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
