import { Bookmark, Calculator, ExternalLink, Info } from 'lucide-react';

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
  icon: React.ReactNode;
  children: React.ReactNode;
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

export default function Home() {
  return (
    <div className="py-8">
      <Section title="Calculators" icon={<Calculator className="h-6 w-6" />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            to="/belts"
            title="Belt Calculator"
            description="Calculate belt drives and pulley systems"
          />
          <Tile
            to="/chains"
            title="Chain Calculator"
            description="Design chain drive systems"
          />
          <Tile
            to="/flywheel"
            title="Flywheel Calculator"
            description="Calculate flywheel energy storage"
          />
          <Tile
            to="/arm"
            title="Arm Calculator"
            description="Design robot arms and pivots"
          />
          <Tile
            to="/linear"
            title="Linear Mechanism Calculator"
            description="Calculate linear motion systems"
          />
          <Tile
            to="/intake"
            title="Intake Calculator"
            description="Design intake mechanisms"
          />
          <Tile
            to="/ratio"
            title="Ratio Calculator"
            description="Calculate gear ratios"
          />
          <Tile
            to="/ratio-finder"
            title="Ratio Finder"
            description="Find optimal gear combinations"
          />
          <Tile
            to="/drive"
            title="Drivetrain Calculator"
            description="Design your robot drivetrain"
          />
          <Tile
            to="/pneumatics"
            title="Pneumatics Calculator"
            description="Calculate pneumatic systems"
          />
          <Tile
            to="/gears"
            title="Gears Calculator"
            description="Design gear systems"
          />
        </div>
      </Section>

      <Section title="Information" icon={<Info className="h-6 w-6" />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            to="/motors"
            title="Motors"
            description="Motor specifications and data"
          />
          <Tile
            to="/compressors"
            title="Compressors"
            description="Compressor specifications"
          />
          <Tile
            to="/about"
            title="About"
            description="About ReCalc and contributors"
          />
          <Tile to="/util" title="Utilities" description="Useful tools" />
          <Tile
            to="/scouting"
            title="Scouting"
            description="Team scouting tools"
          />
        </div>
      </Section>

      <Section title="Shortcuts" icon={<Bookmark className="h-6 w-6" />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Shortcut
              name="2025 Official PDF Manual"
              url="https://firstfrc.blob.core.windows.net/frc2025/Manual/2025GameManual.pdf"
            />
            <Shortcut
              name="2025 Unofficial Web Manual"
              url="https://www.frcmanual.com/2025"
            />
            <Shortcut name="2025 Q&A" url="https://frc-qa.firstinspires.org/" />
          </div>

          <div className="space-y-2">
            <Shortcut
              name="FRC Resources"
              url="https://www.firstinspires.org/resource-library/frc/technical-resources"
            />
            <Shortcut
              name="Open Alliance"
              url="https://www.chiefdelphi.com/c/first/open-alliance/89"
            />
          </div>

          <div className="space-y-2">
            <Shortcut
              name="2025 Team/Event Search"
              url="https://www.firstinspires.org/team-event-search#type=teams&sort=name&programs=FRC&year=2025"
            />
            <Shortcut
              name="2025 FRC-Events"
              url="https://frc-events.firstinspires.org/2025/Events/EventList"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
