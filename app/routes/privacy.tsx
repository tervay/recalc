import {
  BarChart3,
  Cookie,
  ExternalLink,
  FileText,
  Mail,
  Shield,
} from 'lucide-react';

import type { Route } from '.react-router/types/app/routes/+types/privacy';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Privacy Policy - ReCalc' },
    {
      name: 'description',
      content: 'Privacy Policy for ReCalc',
    },
  ];
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              ReCalc Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: November 19, 2025
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Information We Collect */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Information We Collect</h2>
            </div>

            <div className="space-y-4">
              {/* Analytics Section */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">
                    1. Analytics (Umami)
                  </h3>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  We use{' '}
                  <a
                    href="https://umami.is"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium
                      text-primary underline-offset-4 hover:underline"
                  >
                    Umami Analytics
                    <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  to gather simple, privacy-friendly usage statistics. Umami
                  collects anonymous data such as page views, referrers, device
                  / browser type, and general (anonymized) location. Umami does
                  not use cookies and does not identify individual users.
                </p>
              </div>

              {/* Error Reporting Section */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">
                    2. Error &amp; Crash Reporting (Sentry)
                  </h3>
                </div>
                <p className="leading-relaxed text-muted-foreground">
                  We use{' '}
                  <a
                    href="https://sentry.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium
                      text-primary underline-offset-4 hover:underline"
                  >
                    Sentry
                    <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  to diagnose and fix runtime errors. Sentry may collect error
                  details, stack traces, browser and device information, the URL
                  where the error occurred, and recent user actions
                  (&quot;breadcrumbs&quot;). Sentry may also receive an IP
                  address, which can be automatically truncated and anonymized
                  depending on configuration. We do not intentionally send
                  personally identifiable information (PII) to Sentry.
                </p>
              </div>
            </div>
          </div>

          {/* How We Use This Information */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">
                How We Use This Information
              </h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              We use anonymized analytics and crash reports solely to understand
              how people use ReCalc, improve stability and performance, and
              diagnose bugs. We may share aggregated data with the community for
              educational purposes. Your individual session data is never
              shared.
            </p>
          </div>

          {/* Cookies */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Cookies</h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              ReCalc does not set any tracking cookies. Umami uses no cookies.
              Sentry may store a lightweight session ID only for error grouping.
            </p>
          </div>

          {/* Contact */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Contact</h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              If you need support, you can reach me{' '}
              <a
                href="https://www.chiefdelphi.com/u/jtrv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium
                  text-primary underline-offset-4 hover:underline"
              >
                on ChiefDelphi
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </p>
          </div>

          {/* Third-Party Services */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Third-Party Services</h2>
            </div>
            <div className="space-y-2">
              <div
                className="flex items-start gap-3 rounded-lg bg-muted/50 p-3
                  transition-colors hover:bg-muted"
              >
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Umami Analytics
                  </span>{' '}
                  — anonymous usage data
                </p>
              </div>
              <div
                className="flex items-start gap-3 rounded-lg bg-muted/50 p-3
                  transition-colors hover:bg-muted"
              >
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Sentry</span> —
                  crash/error diagnostics
                </p>
              </div>
            </div>
          </div>

          {/* Changes to This Policy */}
          <div
            className="group rounded-xl border bg-card p-5 shadow-sm
              transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Changes to This Policy</h2>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              We may update this privacy policy from time to time. The
              &quot;Last updated&quot; date will always reflect the most recent
              version.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
