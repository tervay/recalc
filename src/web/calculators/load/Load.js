import { queryStringToDefaults } from "common/tooling/query-strings";
import { defaultAssignment } from "common/tooling/versions";
import React, { useState } from "react";
import { StringParam } from "use-query-params";

import load, { PINION, PLANETARY } from "./index";
import PinionAndGear from "./PinionAndGear";
import Planetary from "./Planetary";

export default function Load() {
  const { mode: mode_ } = queryStringToDefaults(
    window.location.search,
    {
      mode: StringParam,
    },
    load.initialState,
    defaultAssignment
  );

  const [mode, setMode] = useState(mode_);
  const calculator = mode === PINION ? <PinionAndGear /> : <Planetary />;

  return (
    <>
      <div className="tabs is-toggle">
        <ul>
          <li className={mode === PINION ? "is-active" : ""}>
            <a onClick={() => setMode(PINION)}>
              <span>{PINION}</span>
            </a>
          </li>
          <li className={mode === PLANETARY ? "is-active" : ""}>
            <a onClick={() => setMode(PLANETARY)}>
              <span>{PLANETARY}</span>
            </a>
          </li>
        </ul>
      </div>
      {calculator}
    </>
  );
}
