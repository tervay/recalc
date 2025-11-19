import * as React from 'react';
import { Link } from 'react-router';

import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

const vendorBadgeStyles: Record<string, string> = {
  WCP: 'border-[#0075c9]/20 bg-[#0075c9]/10 text-[#0075c9] dark:text-[#0075c9] rounded',
  Swyft:
    'border-[#01a1ff]/20 bg-[#01a1ff]/10 text-[#01a1ff] dark:text-[#01a1ff] rounded',
  VBeltGuys:
    'border-[#f52121]/20 bg-[#f52121]/10 text-[#f52121] dark:text-[#f52121] rounded',
  REV: 'border-[#f05a28]/20 bg-[#f05a28]/10 text-[#f05a28] dark:text-[#f05a28] rounded',
  AndyMark:
    'border-[#034ea2]/20 bg-[#034ea2]/10 text-[#034ea2] dark:text-[#034ea2] rounded',
  LastAnvil:
    'border-[#242833]/20 bg-[#242833]/10 text-[#242833] dark:text-[#ffffff] rounded',
  Thrifty:
    'border-[#1e7d39]/20 bg-[#1e7d39]/10 text-[#1e7d39] dark:text-[#1e7d39] rounded',
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
