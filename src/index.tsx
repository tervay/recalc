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

// const f_d = Motor.NEOs(1).diffEq(
//   new Measurement(0.0001, "kg m2"),
//   new Measurement(0.00001, "N m s / rad"),
//   new Measurement(0.01, "H"),
// );

// const solver = new Solver(f_d, 2);

// solver.solve(
//   0,
//   [0, Motor.NEOs(1).stallCurrent.to("A").scalar],
//   1,
//   solver.grid(0.02, (xout, yout) => {
//     console.log({ xout, y0: yout[0], y1: yout[1] });
//   }),
// );
