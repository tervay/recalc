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
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import React from "react";
import { createRoot } from "react-dom/client";
import "scss/index.css";
import "scss/index.scss";
import Routing from "./Routing";

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
    <SpeedInsights />
    <Analytics />
    <Routing />
  </React.StrictMode>,
);
