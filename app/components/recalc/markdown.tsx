import 'katex/dist/katex.min.css';
import { ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '~/components/ui/collapsible';
import { cn } from '~/lib/utils';

interface MarkdownProps {
  markdownContent: string;
}

export default function Markdown({ markdownContent }: MarkdownProps) {
  const sections = markdownContent.split('---').map((section) => {
    const lines = section.split('\n');
    const title = lines[0].replaceAll('#', '').trim();
    const content = lines.slice(1).join('\n');
    return { title, content };
  });

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Collapsible key={section.title} className="group">
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <CollapsibleTrigger
              className={cn(
                'flex w-full items-center justify-between px-6 py-4 text-left',
                'transition-colors hover:bg-muted/50',
              )}
            >
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <ChevronDown
                className="h-5 w-5 text-muted-foreground transition-transform
                  duration-200 group-data-[state=open]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t px-6 pt-2 pb-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-4 last:mb-0">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="mt-6 mb-4 text-2xl font-bold first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mt-5 mb-3 text-xl font-semibold first:mt-0">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-4 mb-2 text-lg font-semibold first:mt-0">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4
                        className="mt-3 mb-2 text-base font-semibold first:mt-0"
                      >
                        {children}
                      </h4>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 ml-6 list-disc last:mb-0">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 ml-6 list-decimal last:mb-0">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-1 last:mb-0">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote
                        className="mb-4 border-l-4 border-muted pl-4 italic
                          last:mb-0"
                      >
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code
                          className="rounded bg-muted px-1.5 py-0.5 font-mono
                            text-sm"
                        >
                          {children}
                        </code>
                      ) : (
                        <code className={className}>{children}</code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre
                        className="mb-4 overflow-x-auto rounded-lg bg-muted p-4
                          last:mb-0"
                      >
                        {children}
                      </pre>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-primary underline hover:text-primary/80"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  );
}
