import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

import { cn } from '~/lib/utils';

interface TileProps {
  to: string;
  title: string;
  description?: string;
  className?: string;
}

export default function Tile({ to, title, description, className }: TileProps) {
  return (
    <Link to={to} className="block">
      <div
        className={cn(
          `group relative overflow-hidden rounded-lg border bg-card p-6
          shadow-sm transition-all duration-200 hover:-translate-y-1
          hover:border-primary/50 hover:shadow-md`,
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-foreground group-hover:text-primary">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}

