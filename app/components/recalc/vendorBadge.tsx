import * as React from 'react';
import { Link } from 'react-router';

import { Badge } from '~/components/ui/badge';
import type { Vendor } from '~/lib/types/common';
import { cn } from '~/lib/utils';

const vendorBadgeStyles: Record<Vendor, string> = {
  WCP: 'border-wcp/20 bg-wcp/10 text-wcp dark:text-wcp rounded',
  Swyft: 'border-swyft/20 bg-swyft/10 text-swyft dark:text-swyft rounded',
  VBeltGuys:
    'border-vbeltguys/20 bg-vbeltguys/10 text-vbeltguys dark:text-vbeltguys rounded',
  REV: 'border-rev/20 bg-rev/10 text-rev dark:text-rev rounded',
  AndyMark:
    'border-andymark/20 bg-andymark/10 text-andymark dark:text-andymark rounded',
  LastAnvil:
    'border-lastanvil/20 bg-lastanvil/10 text-lastanvil dark:text-lastanvil-text-dark rounded',
  Thrifty:
    'border-thrifty/20 bg-thrifty/10 text-thrifty dark:text-thrifty rounded',
  SDS: 'border-sds/20 bg-sds/10 text-sds dark:text-sds rounded',
  BaneBots:
    'border-banebots/20 bg-banebots/10 text-banebots dark:text-banebots rounded',
  CTRE: 'border-ctre/20 bg-ctre/10 text-ctre dark:text-ctre rounded',
  VEX: 'border-vex/20 bg-vex/10 text-vex dark:text-vex rounded',
};

interface VendorBadgeProps extends React.ComponentProps<typeof Badge> {
  vendor: Vendor;
  url?: string;
}

export function VendorBadge({
  vendor,
  url,
  className,
  ...props
}: VendorBadgeProps) {
  const vendorStyle = vendorBadgeStyles[vendor];

  if (url) {
    return (
      <Badge
        variant="outline"
        className={cn(vendorStyle, className)}
        asChild
        {...props}
      >
        <Link to={url}>{vendor}</Link>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(vendorStyle, className)} {...props}>
      {vendor}
    </Badge>
  );
}
