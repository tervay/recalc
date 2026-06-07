import { type ReactNode } from 'react';
import { Link } from 'react-router';
import CarbonTimingBelt from '~icons/carbon/timing-belt';
import EmojioneMonotoneChains from '~icons/emojione-monotone/chains';
import Fa7SolidGears from '~icons/fa7-solid/gears';
import ArrowRight from '~icons/lucide/arrow-right';
import ArrowUpRight from '~icons/lucide/arrow-up-right';
import Disc3Icon from '~icons/lucide/disc-3';
import InfoIcon from '~icons/lucide/info';
import MoveVerticalIcon from '~icons/lucide/move-vertical';
import RatioIcon from '~icons/lucide/ratio';
import RotateCwIcon from '~icons/lucide/rotate-cw';
import SearchIcon from '~icons/lucide/search';
import ZapIcon from '~icons/lucide/zap';
import StreamlineUltimateFactoryIndustrialRobotArm1 from '~icons/streamline-ultimate/factory-industrial-robot-arm-1';

import { cn } from '~/lib/utils';

import type { Route } from '.react-router/types/app/routes/+types/home';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'ReCalc - A collaboration focused mechanical design calculator' },
    {
      name: 'description',
      content:
        'Design calculators for FIRST Robotics Competition teams. Calculate belt drives, chains, flywheels, arms, and more.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <div className="relative overflow-hidden px-4 pt-12 pb-12 text-center md:pt-12 md:pb-12">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.045] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-16 h-96"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 0%, rgb(0 110 182 / 0.1), transparent)',
        }}
      />
      <div className="relative">
        {/* Heading */}
        <h1 className="mb-5 text-6xl font-bold tracking-tight text-foreground md:text-8xl">
          ReCalc
        </h1>
        {/* Tagline */}
        <p className="mx-auto max-w-lg text-base text-muted-foreground md:text-lg">
          A collaboration-focused mechanical design calculator for FIRST
          Robotics.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  label: string;
  className?: string;
}

function SectionHeader({ label, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-center gap-3', className)}>
      <span className="text-xs font-semibold tracking-widest text-primary uppercase">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator card
// ---------------------------------------------------------------------------

interface CalcCardProps {
  to: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

function CalcCard({ to, title, icon: Icon, className }: CalcCardProps) {
  return (
    <Link to={to} className="group block">
      <div
        className={cn(
          'relative flex h-full items-center gap-3 rounded-xl border bg-card p-5 shadow-sm',
          'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
          className,
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-200 group-hover:bg-primary/15">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <h3 className="flex-1 font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
          {title}
        </h3>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Info card (lighter treatment for non-calculator pages)
// ---------------------------------------------------------------------------

interface InfoCardProps {
  to: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

function InfoCard({ to, title, icon: Icon }: InfoCardProps) {
  return (
    <Link to={to} className="group block">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors duration-200 group-hover:bg-primary/10">
          <Icon className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
        </div>
        <p className="flex-1 font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
          {title}
        </p>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Shortcut link
// ---------------------------------------------------------------------------

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
      className="group flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm shadow-sm transition-all duration-150 hover:border-primary/40 hover:bg-accent"
    >
      <span className="text-foreground transition-colors duration-150 group-hover:text-primary">
        {name}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-all duration-150 group-hover:text-primary" />
    </a>
  );
}

interface ShortcutGroupProps {
  label: string;
  children: ReactNode;
}

function ShortcutGroup({ label, children }: ShortcutGroupProps) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const year = new Date().getFullYear();
  return (
    <div className="pb-16">
      <Hero />

      <div className="space-y-14 px-2 md:px-0">
        {/* Calculators */}
        <section>
          <SectionHeader label="Calculators" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CalcCard
              to="/belts"
              title="Belt Calculator"
              icon={CarbonTimingBelt}
            />
            <CalcCard
              to="/chains"
              title="Chain Calculator"
              icon={EmojioneMonotoneChains}
            />
            <CalcCard
              to="/linear"
              title="Linear Mechanism"
              icon={MoveVerticalIcon}
            />
            <CalcCard
              to="/arm"
              title="Arm Calculator"
              icon={StreamlineUltimateFactoryIndustrialRobotArm1}
            />
            <CalcCard
              to="/flywheel"
              title="Flywheel Calculator"
              icon={Disc3Icon}
            />
            <CalcCard
              to="/intake"
              title="Intake Calculator"
              icon={RotateCwIcon}
            />
            <CalcCard
              to="/ratio-finder"
              title="Ratio Finder"
              icon={SearchIcon}
            />
            <CalcCard to="/ratio" title="Ratio Calculator" icon={RatioIcon} />
            <CalcCard
              to="/gears"
              title="Gears Calculator"
              icon={Fa7SolidGears}
            />
          </div>
        </section>

        {/* Information */}
        <section>
          <SectionHeader label="Information" />
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard to="/motors" title="Motors" icon={ZapIcon} />
            <InfoCard to="/about" title="About" icon={InfoIcon} />
          </div>
        </section>

        {/* Shortcuts */}
        <section>
          <SectionHeader label="Shortcuts" />
          <div className="space-y-6">
            <ShortcutGroup label={`${year} Rules & Manuals`}>
              <Shortcut
                name={`${year} Official PDF Manual`}
                url={`https://firstfrc.blob.core.windows.net/frc${year}/Manual/${year}GameManual.pdf`}
              />
              <Shortcut
                name={`${year} Unofficial Web Manual`}
                url={`https://www.frcmanual.com/${year}/introduction`}
              />
              <Shortcut
                name={`${year} Q&A`}
                url="https://frc-qa.firstinspires.org/"
              />
            </ShortcutGroup>

            <ShortcutGroup label={`${year} Events & Teams`}>
              <Shortcut
                name="Team / Event Search"
                url={`https://www.firstinspires.org/team-event-search#type=teams&sort=name&programs=FRC&year=${year}`}
              />
              <Shortcut
                name="FRC-Events"
                url={`https://frc-events.firstinspires.org/${year}/Events/EventList`}
              />
              <Shortcut
                name="TheBlueAlliance"
                url={`https://www.thebluealliance.com/events/${year}`}
              />
            </ShortcutGroup>

            <ShortcutGroup label="Community & Resources">
              <Shortcut name="frc.sh" url="https://frc.sh" />
              <Shortcut
                name="FRC Technical Resources"
                url="https://www.firstinspires.org/resource-library/frc/technical-resources"
              />
              <Shortcut
                name="Open Alliance"
                url="https://www.chiefdelphi.com/c/first/open-alliance/89"
              />
            </ShortcutGroup>
          </div>
        </section>
      </div>
    </div>
  );
}
