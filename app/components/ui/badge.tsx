import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '~/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20',
        outline:
          'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps
  extends useRender.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  /**
   * Merge props onto the single child element instead of rendering a <span>.
   * Legacy Radix-style polymorphism; prefer `render` for new code.
   */
  asChild?: boolean;
}

function Badge({
  className,
  variant = 'default',
  asChild = false,
  render,
  children,
  ...props
}: BadgeProps) {
  const resolvedRender =
    asChild && !render && React.isValidElement(children)
      ? (children as React.ReactElement)
      : render;

  return useRender({
    defaultTagName: 'span',
    props: {
      ...mergeProps<'span'>(
        {
          className: cn(badgeVariants({ variant }), className),
        },
        props as React.ComponentPropsWithRef<'span'>,
      ),
      'data-slot': 'badge',
      children: resolvedRender ? undefined : children,
    },
    render: resolvedRender,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

export { Badge, badgeVariants };
