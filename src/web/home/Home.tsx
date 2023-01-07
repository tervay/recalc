import Tile, { ImageSize } from "common/components/home/Tile";
import Metadata from "common/components/Metadata";
import {
  Column,
  Columns,
  Icon,
  Section,
  Title,
} from "common/components/styling/Building";
import Logo from "common/components/styling/Logo";
import PageConfig from "common/models/PageConfig";
import aboutConfig from "web/about";
import armConfig from "web/calculators/arm";
import beltsConfig from "web/calculators/belts";
import chainConfig from "web/calculators/chain";
import flywheelConfig from "web/calculators/flywheel";
import intakeConfig from "web/calculators/intake";
import linearConfig from "web/calculators/linear";
import pneumaticsConfig from "web/calculators/pneumatics";
import ratioConfig from "web/calculators/ratio";
import compressorsConfig from "web/info/compressors";
import motorsConfig from "web/info/motors";

function Clickable(props: {
  config: PageConfig;
  imageSize?: ImageSize;
}): JSX.Element {
  return (
    <Column ofTwelve={6}>
      <Tile
        title={props.config.title}
        to={props.config.url}
        image={props.config.image}
        imageSize={props.imageSize}
      />
    </Column>
  );
}

function Shortcut(props: {
  name: string;
  url: string;
  size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}): JSX.Element {
  return (
    <Column ofTwelve={props.size ?? 4}>
      <a href={props.url}>
        <div className="recalc-box">
          <div className="subtitle">{props.name}</div>
        </div>
      </a>
    </Column>
  );
}

export default function Home(): JSX.Element {
  return (
    <>
      <Metadata title="A collaboration focused mechanical design calculator." />
      <div className="hero">
        <div
          className="hero-body"
          style={{
            paddingTop: 0,
          }}
        >
          <div className="container has-text-centered">
            <h1 className="title">
              <Logo color="black" alignment="bottom" />
            </h1>
            <h2 className="subtitle">
              A collaboration focused mechanical design calculator.
            </h2>
          </div>
        </div>
      </div>
      <Section extraClasses="remove-padding-top">
        <Title>
          <Icon name="calculator" /> Calculators
        </Title>

        <Columns gapless multiline>
          <Clickable config={beltsConfig} />
          <Clickable config={chainConfig} />
          <Clickable config={pneumaticsConfig} />
          <Clickable config={flywheelConfig} />
          <Clickable config={armConfig} />
          <Clickable config={linearConfig} />
          <Clickable config={intakeConfig} />
          <Clickable config={ratioConfig} />
        </Columns>
      </Section>

      <Section extraClasses="remove-padding-top">
        <Title>
          <Icon name="info-circle" /> Information
        </Title>

        <Columns gapless multiline>
          <Clickable config={motorsConfig} />
          <Clickable config={compressorsConfig} />
          <Clickable config={aboutConfig} imageSize="square" />
        </Columns>
      </Section>

      <Section extraClasses="remove-padding-top">
        <Title>
          <Icon name="bookmark" /> Shortcuts
        </Title>

        <Columns multiline gapless>
          <Shortcut
            name="2023 Game Manual (Encrypted)"
            url="https://firstfrc.blob.core.windows.net/frc2023/Manual/2023FRCGameManual.pdf"
          />
          <Shortcut name="2023 Q&A" url="https://frc-qa.firstinspires.org/" />
          <Shortcut
            name="FRC Resources"
            url="https://www.firstinspires.org/resource-library/frc/technical-resources"
          />

          <Shortcut
            name="Team/Event Search"
            url="https://www.firstinspires.org/team-event-search#type=teams&sort=name&programs=FRC&year=2023"
          />
          <Shortcut
            name="FRC-Events"
            url="https://frc-events.firstinspires.org/2023/Events/EventList"
          />
          <Shortcut
            name="Open Alliance 2023"
            url="https://www.theopenalliance.com/teams/2023/"
          />
        </Columns>
      </Section>
    </>
  );
}
