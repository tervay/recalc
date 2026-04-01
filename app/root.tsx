import { isbot } from 'isbot';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { type ReactNode, useEffect } from 'react';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from 'react-router';

import '~/app.css';
import { AppSidebar } from '~/components/recalc/appSidebar';
import Nav from '~/components/recalc/nav';
import { ThemeProvider } from '~/components/recalc/themeProvider';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import { Warning } from '~/components/ui/warning';

import type { Route } from '.react-router/types/app/+types/root';

function UmamiScript() {
  useEffect(() => {
    if (isbot(navigator.userAgent)) return;

    const script = document.createElement('script');
    script.src = 'https://um.reca.lc/script.js';
    script.defer = true;
    script.dataset.websiteId = 'cdd6f06a-3164-4eb6-a18c-0111d77d6f99';
    document.head.appendChild(script);
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
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <UmamiScript />
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
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
