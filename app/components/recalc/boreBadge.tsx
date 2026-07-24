import * as React from 'react';
import { Link } from 'react-router';

import { Badge } from '~/components/ui/badge';
import type { Bore } from '~/lib/types/common';
import { cn } from '~/lib/utils';

const boreBadgeStyles: Record<Bore, string> = {
  '8mm':
    'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded',
  '5mm Hex':
    'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 rounded',
  '1.125" Round':
    'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400 rounded',
  '1/4" Round':
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded',
  '1/2" Hex':
    'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded',
  '3/8" Hex':
    'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 rounded',
  SplineXS:
    'border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded',
  SplineXL:
    'border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-400 rounded',
  MAXSpline:
    'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400 rounded',
  Falcon:
    'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400 rounded',
  RS775:
    'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded',
  RS550:
    'border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-400 rounded',
  BAG: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded',
  Vortex:
    'border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-400 rounded',
};

interface BoreBadgeProps extends React.ComponentProps<typeof Badge> {
  bore: Bore;
  url?: string;
}

export function BoreBadge({ bore, url, className, ...props }: BoreBadgeProps) {
  const boreStyle = boreBadgeStyles[bore];

  if (url) {
    return (
      <Badge
        variant="outline"
        className={cn(boreStyle, className)}
        asChild
        {...props}
      >
        <Link to={url}>{bore}</Link>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(boreStyle, className)} {...props}>
      {bore}
    </Badge>
  );
}
