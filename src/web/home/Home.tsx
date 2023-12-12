import Tile, { ImageSize } from "common/components/home/Tile";
import Metadata from "common/components/Metadata";
import {
  Column,
  Columns,
  Icon,
  Section,
  Title,
} from "common/components/styling/Building";
import PageConfig from "common/models/PageConfig";
import aboutConfig from "web/about";
import armConfig from "web/calculators/arm";
import beltsConfig from "web/calculators/belts";
import chainConfig from "web/calculators/chain";
import driveConfig from "web/calculators/drive";
import flywheelConfig from "web/calculators/flywheel";
import intakeConfig from "web/calculators/intake";
import linearConfig from "web/calculators/linear";
import pneumaticsConfig from "web/calculators/pneumatics";
import ratioConfig from "web/calculators/ratio";
import ratioFinderConfig from "web/calculators/ratioFinder";
import compressorsConfig from "web/info/compressors";
import motorsConfig from "web/info/motors";
import utilConfig from "web/info/util";

function Clickable(props: {
  config: PageConfig;
  imageSize?: ImageSize | string;
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
          <Clickable config={ratioFinderConfig} />
          <Clickable config={driveConfig} />
        </Columns>
      </Section>

      <Section extraClasses="remove-padding-top">
        <Title>
          <Icon name="info-circle" /> Information
        </Title>

        <Columns gapless multiline>
          <Clickable config={motorsConfig} />
          <Clickable config={compressorsConfig} />
          <Clickable config={aboutConfig} imageSize="96x96" />
          <Clickable config={utilConfig} />
        </Columns>
      </Section>

      <Section extraClasses="remove-padding-top">
        <Title>
          <Icon name="bookmark" /> Shortcuts
        </Title>

        <Columns multiline gapless>
          <Shortcut
            name="2023 Game Manual"
            url="https://firstfrc.blob.core.windows.net/frc2023/Manual/2023FRCGameManual.pdf"
          />
          <Shortcut name="2023 Q&A" url="https://frc-qa.firstinspires.org/" />

          <Shortcut
            name="FRC Resources"
            url="https://www.firstinspires.org/resource-library/frc/technical-resources"
          />

          <Shortcut
            name="2024 Team/Event Search"
            url="https://www.firstinspires.org/team-event-search#type=teams&sort=name&programs=FRC&year=2024"
          />
          <Shortcut
            name="2024 FRC-Events"
            url="https://frc-events.firstinspires.org/2024/Events/EventList"
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
