import { AlertCircle, Code, ExternalLink, Shield } from 'lucide-react';
import { Link } from 'react-router';

import LineMdHeartFilled from '~icons/line-md/heart-filled';
import MaterialSymbolsInfoOutlineRounded from '~icons/material-symbols/info-outline-rounded';

import type { Route } from '.react-router/types/app/routes/+types/about';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'About - ReCalc' },
    {
      name: 'description',
      content: 'About ReCalc',
    },
  ];
}

export default function About() {
  return (
    <div className="bg-linear-to-b from-background to-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Hero Section */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-balance">
            About ReCalc
          </h1>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-4">
          {/* What is ReCalc */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <MaterialSymbolsInfoOutlineRounded
                  className="h-5 w-5 text-primary"
                />
              </div>
              <h2 className="text-xl font-semibold">What is ReCalc?</h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">ReCalc</span> is a
              mechanical design calculator, focused on ease of collaboration and
              a quality user interface. It focuses primarily on helping teams in
              the{' '}
              <a
                href="https://www.firstinspires.org/programs/frc/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium
                  text-primary underline-offset-4 hover:underline"
              >
                FIRST Robotics Competition (FRC)
                <ExternalLink className="h-3 w-3" />
              </a>{' '}
              and{' '}
              <a
                href="https://www.firstinspires.org/programs/ftc/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium
                  text-primary underline-offset-4 hover:underline"
              >
                FIRST Tech Challenge (FTC)
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </p>
          </div>

          {/* Thanks & Credits */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <LineMdHeartFilled className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Thanks &amp; Credits</h2>
            </div>
            <p className="mb-3 leading-relaxed text-muted-foreground">
              My thanks go to many people throughout the FRC community,
              specifically:
            </p>
            <div className="space-y-2">
              {[
                {
                  name: 'pchild',
                  desc: 'for',
                  link: 'https://docs.google.com/spreadsheets/d/14EuiVDz4uvvVL2AjZqj3sKWue6_OzR7Nu98l_mk1me8/edit#gid=340525968',
                  linkText: '401 Calc',
                },
                {
                  name: 'AriMB',
                  desc: 'for',
                  link: 'https://ambcalc.com/',
                  linkText: 'AMBCalc',
                },
                {
                  name: 'dydx',
                  desc: 'for',
                  link: 'https://www.chiefdelphi.com/t/flywheel-calculator/372836',
                  linkText: 'JuliaDesignCalc',
                },
                {
                  name: 'Connor_H',
                  desc: 'for modifications to the DC motor icon',
                },
                {
                  name: 'WPILib',
                  desc: 'for the',
                  link: 'https://github.com/wpilibsuite/allwpilib',
                  linkText: 'WPILib library, documentation, and models',
                },
                {
                  name: 'CTRE',
                  desc: 'for the',
                  link: 'https://motors.ctr-electronics.com/',
                  linkText: 'motor dyno data',
                  extra: 'and current limit modeling advice',
                },
              ].map((credit, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-muted/50 p-3
                    transition-colors hover:bg-muted"
                >
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <p className="text-sm leading-relaxed">
                    <span className="font-medium text-foreground">
                      {credit.name}
                    </span>
                    {', '}
                    {credit.desc}{' '}
                    {credit.link && (
                      <a
                        href={credit.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium
                          text-primary underline-offset-4 hover:underline"
                      >
                        {credit.linkText}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {credit.extra && ' ' + credit.extra}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t pt-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                And of course all the people who found bugs and offered feedback
                &amp; suggestions.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Original DC motor icon created by{' '}
                <a
                  href="https://iconscout.com/icon/dc-motor-2915251"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium
                    text-primary underline-offset-4 hover:underline"
                >
                  ic2icon on iconscout
                  <ExternalLink className="h-3 w-3" />
                </a>
                .
              </p>
            </div>
          </div>

          {/* Accuracy Section */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">
                How accurate are the calculators?
              </h2>
            </div>
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              <p>
                The math behind them is sound &quot;in theory,&quot; but of
                course, everything works in theory. There are lots of variables
                that go into a robot, and the results of the calculator may not
                be perfect.
              </p>
              <p>
                If you believe there to be any error in the calculators (major
                or minor), please feel free to{' '}
                <a
                  href="https://www.chiefdelphi.com/u/jtrv/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium
                    text-primary underline-offset-4 hover:underline"
                >
                  send a message on CD
                  <ExternalLink className="h-3 w-3" />
                </a>{' '}
                or{' '}
                <a
                  href="https://github.com/tervay/recalc/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium
                    text-primary underline-offset-4 hover:underline"
                >
                  open an issue on GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
                .
              </p>
            </div>
          </div>

          {/* Source Code */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Source Code</h2>
            </div>
            <div className="space-y-3 leading-relaxed text-muted-foreground">
              <p>
                The source code for{' '}
                <span className="font-semibold text-foreground">ReCalc</span>{' '}
                can be found{' '}
                <a
                  href="https://github.com/tervay/recalc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium
                    text-primary underline-offset-4 hover:underline"
                >
                  on GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
                . Pull requests / issues / suggestions are welcome!
              </p>
            </div>
          </div>

          {/* Privacy Policy */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Privacy Policy</h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              Our privacy policy is available{' '}
              <Link
                to="/privacy"
                className="font-medium text-primary underline-offset-4
                  hover:underline"
              >
                here
              </Link>
              .
            </p>
          </div>

          {/* Disclaimer */}
          <div
            className="rounded-xl border border-muted-foreground/20 bg-muted/30
              p-5"
          >
            <h2 className="mb-3 text-lg font-semibold">Disclaimer</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This site is not in any way affiliated or endorsed by FIRST, any
              previous, current, or future employers of the author, or any
              previous, current, or future teams of the author. The author is
              not responsible for any errors or omissions in the calculators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
