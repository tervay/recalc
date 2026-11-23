import { cn } from 'cn';
import type { ComponentType, SVGProps } from 'react';
import { Link } from 'react-router';
import InfinityIcon from '~icons/lucide/infinity';
import WrenchIcon from '~icons/lucide/wrench';

import andymark from '~/assets/vendors/andymark.png';
import banebots from '~/assets/vendors/banebots.png';
import ctre from '~/assets/vendors/ctre.png';
import lastanvil from '~/assets/vendors/lastanvil.png';
import rev from '~/assets/vendors/rev.png';
import sds from '~/assets/vendors/sds.png';
import swyft from '~/assets/vendors/swyft.png';
import thrifty from '~/assets/vendors/thrifty.png';
import vex from '~/assets/vendors/vex.png';
import wcp from '~/assets/vendors/wcp.png';
import type { Vendor } from '~/lib/types/common';

const vendorIcons: Record<
  Vendor,
  string | ComponentType<SVGProps<SVGSVGElement>>
> = {
  AndyMark: andymark,
  BaneBots: banebots,
  CTRE: ctre,
  Custom: WrenchIcon,
  LastAnvil: lastanvil,
  REV: rev,
  SDS: sds,
  Swyft: swyft,
  Thrifty: thrifty,
  VBeltGuys: InfinityIcon,
  VEX: vex,
  WCP: wcp,
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
