import { Bookmark, Calculator, ExternalLink, Info } from 'lucide-react';
import { type ReactNode } from 'react';

import ArcticonsFolderUtility from '~icons/arcticons/folder-utility';
import CarbonTimingBelt from '~icons/carbon/timing-belt';
import EmojioneMonotoneChains from '~icons/emojione-monotone/chains';
import Fa7SolidGears from '~icons/fa7-solid/gears';
import FluentDriveTrain24Regular from '~icons/fluent/drive-train-24-regular';
import FluentElevator32Regular from '~icons/fluent/elevator-32-regular';
import FluentRatioOneToOne24Regular from '~icons/fluent/ratio-one-to-one-24-regular';
import MaterialSymbolsElectricBoltRounded from '~icons/material-symbols/electric-bolt-rounded';
import MaterialSymbolsSearchRounded from '~icons/material-symbols/search-rounded';
import MdiAbout from '~icons/mdi/about';
import SolarWheelAngleOutline from '~icons/solar/wheel-angle-outline';
import StreamlineUltimateFactoryIndustrialRobotArm1 from '~icons/streamline-ultimate/factory-industrial-robot-arm-1';
import TablerWheel from '~icons/tabler/wheel';

import Tile from '~/components/recalc/tile';

import type { Route } from '.react-router/types/app/routes/+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'ReCalc - A collaboration focused mechanical design calculator' },
    {
      name: 'description',
      content:
        'Design calculators for FIRST Robotics Competition teams. Calculate belt drives, chains, flywheels, arms, and more.',
    },
  ];
}

interface ShortcutProps {
  name: string;
  url: string;
}

function Shortcut({ name, url }: ShortcutProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 rounded-lg border bg-card p-3
        text-sm transition-all hover:border-primary/50 hover:bg-accent"
    >
      <span className="flex-1 text-foreground group-hover:text-primary">
        {name}
      </span>
      <ExternalLink
        className="h-4 w-4 text-muted-foreground group-hover:text-primary"
      />
    </a>
  );
}

interface SectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <section className="mb-12">
      <h2
        className="mb-6 flex items-center gap-2 text-2xl font-semibold
          text-foreground"
      >
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Heading() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1
        className="group relative cursor-default overflow-hidden text-6xl
          font-bold tracking-tight text-primary transition-all duration-300
          hover:scale-105 md:text-8xl"
      >
        <span className="relative inline-block">
          ReCalc
          <span
            className="absolute inset-0 -translate-x-full bg-linear-to-r
              from-transparent via-white/60 to-transparent transition-transform
              duration-1500 ease-in-out group-hover:translate-x-full"
          />
        </span>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground md:text-xl">
        A collaboration-focused mechanical design calculator for FIRST Robotics.
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="px-2 py-4 md:px-0 md:py-12">
      <div className="mb-12">
        <Heading />
      </div>
      <Section title="Calculators" icon={<Calculator className="h-6 w-6" />}>
        <div className="flex flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Tile to="/belts" title="Belt Calculator" icon={CarbonTimingBelt} />
            <Tile
              to="/chains"
              title="Chain Calculator"
              icon={EmojioneMonotoneChains}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Tile
              to="/linear"
              title="Linear Mechanism Calculator"
              icon={FluentElevator32Regular}
            />
            <Tile
              to="/arm"
              title="Arm Calculator"
              icon={StreamlineUltimateFactoryIndustrialRobotArm1}
            />
            <Tile
              to="/flywheel"
              title="Flywheel Calculator"
              icon={TablerWheel}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Tile
              to="/ratio-finder"
              title="Ratio Finder"
              icon={MaterialSymbolsSearchRounded}
            />
            <Tile
              to="/ratio"
              title="Ratio Calculator"
              icon={FluentRatioOneToOne24Regular}
            />
            <Tile to="/gears" title="Gears Calculator" icon={Fa7SolidGears} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Tile
              to="/intake"
              title="Intake Calculator"
              icon={SolarWheelAngleOutline}
            />
            <Tile
              to="/drive"
              title="Drivetrain Calculator"
              icon={FluentDriveTrain24Regular}
            />
          </div>
        </div>
      </Section>

      <Section title="Information" icon={<Info className="h-6 w-6" />}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            to="/motors"
            title="Motors"
            icon={MaterialSymbolsElectricBoltRounded}
          />
          <Tile to="/util" title="Utilities" icon={ArcticonsFolderUtility} />
          <Tile to="/about" title="About" icon={MdiAbout} />
        </div>
      </Section>

      <Section title="Shortcuts" icon={<Bookmark className="h-6 w-6" />}>
        <div className="flex flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <Shortcut
              name="2025 Official PDF Manual"
              url="https://firstfrc.blob.core.windows.net/frc2025/Manual/2025GameManual.pdf"
            />
            <Shortcut
              name="2025 Unofficial Web Manual"
              url="https://www.frcmanual.com/2025/introduction"
            />
            <Shortcut name="2025 Q&A" url="https://frc-qa.firstinspires.org/" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Shortcut
              name="2026 Team/Event Search"
              url="https://www.firstinspires.org/team-event-search#type=teams&sort=name&programs=FRC&year=2026"
            />
            <Shortcut
              name="2026 FRC-Events"
              url="https://frc-events.firstinspires.org/2026/Events/EventList"
            />
            <Shortcut
              name="2026 Events (TheBlueAlliance)"
              url="https://www.thebluealliance.com/events/2026"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Shortcut name="frc.sh" url="https://frc.sh" />
            <Shortcut
              name="FRC Resources"
              url="https://www.firstinspires.org/resource-library/frc/technical-resources"
            />
            <Shortcut
              name="Open Alliance"
              url="https://www.chiefdelphi.com/c/first/open-alliance/89"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
