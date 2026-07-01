import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { type ReactNode, useEffect } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import '~/app.css';
import { AppSidebar } from '~/components/recalc/appSidebar';
import { ErrorDisplay } from '~/components/recalc/errorDisplay';
import Nav from '~/components/recalc/nav';
import { ThemeProvider } from '~/components/recalc/themeProvider';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import { Warning } from '~/components/ui/warning';

import type { Route } from '.react-router/types/app/+types/root';

function OpenPanelScript() {
  useEffect(() => {
    // Dynamically imported so the SDK is excluded from the initial bundle.
    // Environment gating (dev, bots, missing client id) lives in initOpenPanel.
    void import('~/lib/openpanel').then(({ initOpenPanel }) => {
      initOpenPanel();
    });
  }, []);

  return null;
}

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/svg+xml', href: '/logo/motor.svg' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <OpenPanelScript />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset>
              <Nav />
              <div className="container mx-auto" data-testid="entrypoint">
                {children}
                <div className="mt-48">
                  <Warning />
                </div>
              </div>
            </SidebarInset>
            <ScrollRestoration />
            <Scripts />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default function App() {
  return (
    <NuqsAdapter>
      <Outlet />
    </NuqsAdapter>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorDisplay error={error} />;
}
