import { setTitle } from "common/tooling/routing";
import version from "version";

export default function About() {
  setTitle("About");

  return (
    <div className="content">
      <h2 className="title is-2">⎰ReCalc</h2>

      <h3 className="title is-3">About</h3>
      <p>
        ⎰ReCalc is a mechanical design calculator, focused on ease of
        collaboration and a quality user interface.
      </p>

      <h3 className="title is-3">Thanks & Credits</h3>
      <p>
        My thanks to go many people throughout the FRC community, specifically
        CD users:
      </p>
      <ul>
        <li>
          AriMB, for{" "}
          <a href="https://arimb.github.io/AMB_Design_Spreadsheet/">
            an incredible design calculator
          </a>
        </li>
        <li>
          pchild, also for{" "}
          <a href="http://calc.team401.org/">an incredible design calculator</a>
        </li>
        <li>
          dydx, for{" "}
          <a href="https://www.chiefdelphi.com/t/flywheel-calculator/372836">
            a great flywheel calculator
          </a>{" "}
          and explaining how it works to me
        </li>
        <li>
          JVN, for{" "}
          <a href="https://johnvneun.com/calc">
            one of the most impactful design calculators in FRC
          </a>
        </li>
        <li>JackTervay, for the renders on the landing</li>
      </ul>
      <p>
        And of course all the people who found bugs and offered feedback &
        suggestions.
      </p>

      <h3 className="title is-3">How accurate are the calculators?</h3>
      <p>
        The math behind them is sound &ldquo;in theory,&rdquo; but of course,
        everything works in theory. There are lots of variables that go into a
        robot, and the results of the calculator may not be perfect. If you
        believe there to be any error in the calculators (major or minor),
        please feel free to{" "}
        <a href="https://www.chiefdelphi.com/u/jtrv/">shoot me a PM on CD</a> or{" "}
        <a href="https://github.com/tervay/recalc/issues">
          open an issue on GitHub.
        </a>
      </p>

      <h3 className="title is-3">Source code</h3>
      <p>
        The source code for ⎰ReCalc can be found{" "}
        <a href="https://github.com/tervay/recalc">on GitHub.</a>
      </p>
      <p>Pull requests / issues / suggestions are welcome!</p>

      <a href={"https://github.com/tervay/recalc/tree/v" + version}>
        <div className="tags has-addons">
          <span className="tag">Version</span>
          <span className="tag is-primary">{version}</span>
        </div>
      </a>

      <h3 className="title is-3">Disclaimer</h3>
      <p>
        This site is not in any way affiliated or endorsed by FIRST nor Google.
      </p>
    </div>
  );
}
