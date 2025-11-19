import { Home } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import ArcticonsFolderUtility from '~icons/arcticons/folder-utility';
import CarbonTimingBelt from '~icons/carbon/timing-belt';
import EmojioneMonotoneChains from '~icons/emojione-monotone/chains';
import Fa7SolidGears from '~icons/fa7-solid/gears';
import FluentElevator32Regular from '~icons/fluent/elevator-32-regular';
import FluentRatioOneToOne24Regular from '~icons/fluent/ratio-one-to-one-24-regular';
import MaterialSymbolsElectricBoltRounded from '~icons/material-symbols/electric-bolt-rounded';
import MaterialSymbolsSearchRounded from '~icons/material-symbols/search-rounded';
import MdiAbout from '~icons/mdi/about';
import SolarWheelAngleOutline from '~icons/solar/wheel-angle-outline';
import StreamlineUltimateFactoryIndustrialRobotArm1 from '~icons/streamline-ultimate/factory-industrial-robot-arm-1';
import TablerWheel from '~icons/tabler/wheel';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';

interface SidebarLink {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const calculatorLinks: SidebarLink[] = [
  { title: 'Belt Calculator', url: '/belts', icon: CarbonTimingBelt },
  { title: 'Chain Calculator', url: '/chains', icon: EmojioneMonotoneChains },
  {
    title: 'Linear Mechanism Calculator',
    url: '/linear',
    icon: FluentElevator32Regular,
  },
  {
    title: 'Arm Calculator',
    url: '/arm',
    icon: StreamlineUltimateFactoryIndustrialRobotArm1,
  },
  { title: 'Flywheel Calculator', url: '/flywheel', icon: TablerWheel },
  {
    title: 'Ratio Finder',
    url: '/ratio-finder',
    icon: MaterialSymbolsSearchRounded,
  },
  {
    title: 'Ratio Calculator',
    url: '/ratio',
    icon: FluentRatioOneToOne24Regular,
  },
  { title: 'Gears Calculator', url: '/gears', icon: Fa7SolidGears },
  { title: 'Intake Calculator', url: '/intake', icon: SolarWheelAngleOutline },
];

const informationLinks: SidebarLink[] = [
  { title: 'Motors', url: '/motors', icon: MaterialSymbolsElectricBoltRounded },
  { title: 'Utilities', url: '/util', icon: ArcticonsFolderUtility },
  { title: 'About', url: '/about', icon: MdiAbout },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  function isActive(url: string) {
    if (url === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(url);
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/')}>
              <Link to="/">
                <Home className="size-4" />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Calculators</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {calculatorLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <SidebarMenuItem key={link.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(link.url)}
                      tooltip={link.title}
                    >
                      <Link to={link.url}>
                        <Icon className="size-4" />
                        <span>{link.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Information</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {informationLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <SidebarMenuItem key={link.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(link.url)}
                      tooltip={link.title}
                    >
                      <Link to={link.url}>
                        <Icon className="size-4" />
                        <span>{link.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
