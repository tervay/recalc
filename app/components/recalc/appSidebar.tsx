import { Link, useLocation } from 'react-router';
import CarbonTimingBelt from '~icons/carbon/timing-belt';
import EmojioneMonotoneChains from '~icons/emojione-monotone/chains';
import Fa7SolidGears from '~icons/fa7-solid/gears';
import Disc3Icon from '~icons/lucide/disc-3';
import Home from '~icons/lucide/home';
import InfoIcon from '~icons/lucide/info';
import MoveVerticalIcon from '~icons/lucide/move-vertical';
import RatioIcon from '~icons/lucide/ratio';
import RotateCwIcon from '~icons/lucide/rotate-cw';
import SearchIcon from '~icons/lucide/search';
import ZapIcon from '~icons/lucide/zap';
import StreamlineUltimateFactoryIndustrialRobotArm1 from '~icons/streamline-ultimate/factory-industrial-robot-arm-1';

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
    icon: MoveVerticalIcon,
  },
  {
    title: 'Arm Calculator',
    url: '/arm',
    icon: StreamlineUltimateFactoryIndustrialRobotArm1,
  },
  { title: 'Flywheel Calculator', url: '/flywheel', icon: Disc3Icon },
  {
    title: 'Ratio Finder',
    url: '/ratio-finder',
    icon: SearchIcon,
  },
  {
    title: 'Ratio Calculator',
    url: '/ratio',
    icon: RatioIcon,
  },
  { title: 'Gears Calculator', url: '/gears', icon: Fa7SolidGears },
  { title: 'Intake Calculator', url: '/intake', icon: RotateCwIcon },
];

const informationLinks: SidebarLink[] = [
  { title: 'Motors', url: '/motors', icon: ZapIcon },
  { title: 'About', url: '/about', icon: InfoIcon },
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
            <SidebarMenuButton
              isActive={isActive('/')}
              render={
                <Link to="/">
                  <Home className="size-4" />
                  <span>Home</span>
                </Link>
              }
            />
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
                      isActive={isActive(link.url)}
                      tooltip={link.title}
                      render={
                        <Link to={link.url}>
                          <Icon className="size-4" />
                          <span>{link.title}</span>
                        </Link>
                      }
                    />
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
                      isActive={isActive(link.url)}
                      tooltip={link.title}
                      render={
                        <Link to={link.url}>
                          <Icon className="size-4" />
                          <span>{link.title}</span>
                        </Link>
                      }
                    />
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
