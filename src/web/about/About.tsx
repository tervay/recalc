import Metadata from "common/components/Metadata";
import aboutConfig from "web/about";

export default function About(): JSX.Element {
  return (
    <>
      <Metadata pageConfig={aboutConfig} />
      <div>
        <div className="content">
          <h3 className="title is-3">
            <i className="fas fa-info-circle" /> About
          </h3>
          <p>
            <b>ReCalc</b> is a mechanical design calculator, focused on ease of
            collaboration and a quality user interface.
          </p>

          <h3 className="title is-3">
            <i className="fas fa-users" /> Thanks & Credits
          </h3>
          <p>
            My thanks to go many people throughout the FRC community,
            specifically CD users:
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
              <a href="https://docs.google.com/spreadsheets/d/14EuiVDz4uvvVL2AjZqj3sKWue6_OzR7Nu98l_mk1me8/edit#gid=340525968">
                an incredible design calculator
              </a>
            </li>
            <li>
              dydx, for{" "}
              <a href="https://www.chiefdelphi.com/t/flywheel-calculator/372836">
                a great flywheel calculator
              </a>
              , which served as the basis for ReCalc&apos;s
            </li>
            <li>JackTervay, for the renders on the landing</li>
            <li>Connor_H, for modifications to the DC motor icon</li>
          </ul>
          <p>
            And of course all the people who found bugs and offered feedback &
            suggestions.
          </p>
          <p>
            Original DC motor icon created by{" "}
            <a href="https://iconscout.com/icon/dc-motor-2915251">
              <b>ic2icon</b> on iconscout
            </a>
            .
          </p>

          <h3 className="title is-3">How accurate are the calculators?</h3>
          <p>
            The math behind them is sound &ldquo;in theory,&rdquo; but of
            course, everything works in theory. There are lots of variables that
            go into a robot, and the results of the calculator may not be
            perfect. If you believe there to be any error in the calculators
            (major or minor), please feel free to{" "}
            <a href="https://www.chiefdelphi.com/u/jtrv/">
              shoot me a PM on CD
            </a>{" "}
            or{" "}
            <a href="https://github.com/tervay/recalc/issues">
              open an issue on GitHub.
            </a>
          </p>

          <h3 className="title is-3">
            <i className="fas fa-code-branch" /> Source code
          </h3>
          <p>
            The source code for <b>ReCalc</b> can be found{" "}
            <a href="https://github.com/tervay/recalc">on GitHub.</a>
          </p>
          <p>Pull requests / issues / suggestions are welcome!</p>

          <h3 className="title is-3">Disclaimer</h3>
          <p>This site is not in any way affiliated or endorsed by FIRST.</p>
        </div>
      </div>
    </>
  );
}
