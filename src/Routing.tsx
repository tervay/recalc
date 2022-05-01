import {
  Column,
  Columns,
  Footer,
  Message,
} from "common/components/styling/Building";
import Nav from "common/components/styling/Nav";
import PageConfig from "common/models/PageConfig";
import { Suspense } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import aboutConfig from "web/about";
import armConfig from "web/calculators/arm";
import beltsConfig from "web/calculators/belts";
import chainConfig from "web/calculators/chain";
import flywheelConfig from "web/calculators/flywheel";
import intakeConfig from "web/calculators/intake";
import linearConfig from "web/calculators/linear";
import pneumaticsConfig from "web/calculators/pneumatics";
import Home from "web/home/Home";
import compressorsConfig from "web/info/compressors";
import beltDataConfig from "web/info/data/belts";
import motorsConfig from "web/info/motors";
import utilConfig from "web/info/util";

function Routable(props: { config: PageConfig }): JSX.Element {
  return <Route path={props.config.url} component={props.config.component} />;
}

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Nav />
      <section className="section">
        <div className="container">
          <Suspense
            fallback={
              <progress className="progress is-small is-primary" max="100" />
            }
          >
            <Switch>
              <Route exact path="/">
                <Home />
              </Route>
              <Route
                path="/data"
                render={({ match: { url } }) => (
                  <>
                    <Route
                      path={`${url}/${beltDataConfig.url}`}
                      component={beltDataConfig.component}
                      exact
                    />
                  </>
                )}
              />

              <QueryParamProvider ReactRouterRoute={Route}>
                <Routable config={beltsConfig} />
                <Routable config={chainConfig} />
                <Routable config={pneumaticsConfig} />
                <Routable config={flywheelConfig} />
                <Routable config={armConfig} />
                <Routable config={linearConfig} />
                <Routable config={intakeConfig} />

                <Routable config={motorsConfig} />
                <Routable config={compressorsConfig} />
                <Routable config={aboutConfig} />
                <Routable config={utilConfig} />
              </QueryParamProvider>
            </Switch>
          </Suspense>

          <Footer>
            <Columns centered>
              <Column ofTwelve={6}>
                <Message color="warning">
                  These calculators are provided as reference <b>only</b>. These
                  should not be taken as the holy truth of the universe - they
                  are estimates created in order to guide you to the best
                  solution. I cannot guarantee the math is perfectly accurate in
                  all scenarios.
                </Message>
              </Column>
            </Columns>
          </Footer>
        </div>
      </section>
    </BrowserRouter>
  );
}

export default App;
