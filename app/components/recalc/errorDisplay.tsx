import { useState } from 'react';
import { isRouteErrorResponse } from 'react-router';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';

interface Props {
  error: unknown;
}

export function ErrorDisplay({ error }: Props) {
  const [stackOpen, setStackOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  let title = 'Unexpected Error';
  let message = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    title =
      error.status === 404 ? '404 Not Found' : `Error ${String(error.status)}`;
    message =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || message;
  } else if (error instanceof Error) {
    title = error.name;
    message = error.message;
    stack = error.stack;
  } else if (typeof error === 'string') {
    message = error;
  }

  const copyDetails = () => {
    const lines = [
      `Error: ${title}`,
      `Message: ${message}`,
      stack ? `\nStack:\n${stack}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    void navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="container mx-auto max-w-3xl p-4 pt-16">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-destructive">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{message}</p>

          <p className="text-sm text-muted-foreground">
            Please consider reporting this on{' '}
            <a
              href="https://github.com/tervay/recalc2/issues"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              GitHub
            </a>{' '}
            or{' '}
            <a
              href="https://www.chiefdelphi.com/t/recalc-an-online-mechanical-design-calculator-with-shareable-urls/390181"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              Chief Delphi
            </a>{' '}
            and include the error details using the button below.
          </p>

          {stack && (
            <Collapsible open={stackOpen} onOpenChange={setStackOpen}>
              <CollapsibleTrigger
                render={
                  <Button variant="outline" size="sm">
                    {stackOpen ? 'Hide stack trace' : 'Show stack trace'}
                  </Button>
                }
              />
              <CollapsibleContent>
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-4 text-xs leading-relaxed">
                  <code>{stack}</code>
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex gap-2">
            <Button asChild>
              <a href="/">Go home</a>
            </Button>
            <Button variant="outline" onClick={copyDetails}>
              {copied ? 'Copied!' : 'Copy error details'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
