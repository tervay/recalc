import type { ReactNode } from 'react';

import { cn } from '~/lib/utils';

export default function IOLine({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-row flex-wrap gap-x-4 *:flex-1 md:flex-nowrap',
        className,
      )}
    >
      {children}
    </div>
  );
}
