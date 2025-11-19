import * as React from 'react';
import { Link } from 'react-router';

import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

const vendorBadgeStyles: Record<string, string> = {
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
  default:
    'border-gray-500/20 bg-gray-500/10 text-gray-700 dark:text-gray-400 rounded',
};

interface VendorBadgeProps extends React.ComponentProps<typeof Badge> {
  vendor: string;
  url?: string;
}

const validVendors = [
  'WCP',
  'Swyft',
  'VBeltGuys',
  'REV',
  'AndyMark',
  'LastAnvil',
  'Thrifty',
] as const;

type ValidVendor = (typeof validVendors)[number];

function isValidVendor(vendor: string): vendor is ValidVendor {
  return validVendors.includes(vendor as ValidVendor);
}

export function VendorBadge({
  vendor,
  url,
  className,
  ...props
}: VendorBadgeProps) {
  const vendorKey = isValidVendor(vendor) ? vendor : 'default';
  const vendorStyle = vendorBadgeStyles[vendorKey] ?? vendorBadgeStyles.default;

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
