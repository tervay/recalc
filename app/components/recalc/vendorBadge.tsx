import { cn } from 'cn';
import type { ComponentType, SVGProps } from 'react';
import { Link } from 'react-router';
import InfinityIcon from '~icons/lucide/infinity';
import WrenchIcon from '~icons/lucide/wrench';

import type { Vendor } from '~/lib/types/common';

const vendorIcons: Record<
  Vendor,
  string | ComponentType<SVGProps<SVGSVGElement>>
> = {
  AndyMark: '/vendors/andymark.png',
  BaneBots: '/vendors/banebots.png',
  CTRE: '/vendors/ctre.png',
  Custom: WrenchIcon,
  LastAnvil: '/vendors/lastanvil.png',
  REV: '/vendors/rev.png',
  SDS: '/vendors/sds.png',
  Swyft: '/vendors/swyft.png',
  Thrifty: '/vendors/thrifty.png',
  VBeltGuys: InfinityIcon,
  VEX: '/vendors/vex.png',
  WCP: '/vendors/wcp.png',
};

const vendorImageClassNames: Partial<Record<Vendor, string>> = {
  REV: 'rounded-sm',
};

interface VendorBadgeProps {
  vendor: Vendor;
  url?: string;
  className?: string;
}

export function VendorBadge({ vendor, url, className }: VendorBadgeProps) {
  const Icon = vendorIcons[vendor];
  const icon =
    typeof Icon === 'string' ? (
      <img
        src={Icon}
        alt={vendor}
        width={16}
        height={16}
        loading="lazy"
        className={cn(
          'size-full object-contain',
          vendorImageClassNames[vendor],
        )}
      />
    ) : (
      <>
        <Icon aria-hidden className="size-full" />
        <span className="sr-only">{vendor}</span>
      </>
    );
  const tileClassName = cn(
    'inline-flex size-5 shrink-0 items-center justify-center rounded-sm bg-white p-0.5 text-black ring-1 ring-border',
    className,
  );

  if (url) {
    return (
      <Link to={url} title={vendor} className={tileClassName}>
        {icon}
      </Link>
    );
  }

  return (
    <span title={vendor} className={tileClassName}>
      {icon}
    </span>
  );
}
