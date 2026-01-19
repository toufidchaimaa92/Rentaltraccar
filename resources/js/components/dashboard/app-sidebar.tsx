'use client';

import { resourceIcons } from '@/constants/resource-icons';
import * as React from 'react';

import { NavMain } from '@/components/dashboard/nav-main';
import { NavSecondary } from '@/components/dashboard/nav-secondary';
import { NavUser } from '@/components/dashboard/nav-user';
import SvgIcon from '@/components/global/iconssvg';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { PageProps } from '@/types';
import { usePage, Link } from '@inertiajs/react';

const data = {
  projects: [
    {
      logo: SvgIcon,
      title: 'Taliani Auto',
      subtitle: 'Louez votre voiture facilement',
    },
  ],
  navMain: [
    {
      title: 'Créer une location',
      url: '/rentals/select-type',
      icon: resourceIcons.createRental,
    },
    {
      title: 'Tableau de bord',
      url: '/dashboard',
      icon: resourceIcons.dashboard,
    },
    {
      title: 'Calendrier',
      url: '/calendar',
      icon: resourceIcons.calendar,
    },
    {
      title: 'Locations',
      url: '/rentals',
      icon: resourceIcons.rentals,
    },
    {
      title: 'Locations Longue Durée',
      url: '/rentals/long-term',
      icon: resourceIcons.longTermRentals,
    },
    {
      title: 'Créer une facture',
      url: '/factures/create',
      icon: resourceIcons.createInvoice,
    },
    {
      title: 'Factures',
      url: '/factures',
      icon: resourceIcons.invoices,
    },
  ],
  navSecondary: [
    {
      title: 'Clients',
      url: '/clients',
      icon: resourceIcons.clients,
    },
    {
      title: 'Gestion des Voitures',
      url: '/car-models',
      icon: resourceIcons.carModels,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;
  const activeProject = data.projects[0];
  const Logo = activeProject.logo;

  // Clone base items
  let navMain = [...data.navMain];
  let navSecondary = [...data.navSecondary];

  // 🔐 Admin-only sidebar links (keep only operational ones)
  if (user.role === 'admin') {
    navSecondary = [
      ...navSecondary,
      {
        title: 'Employés',
        url: '/admin/employees',
        icon: resourceIcons.adminEmployees,
      },
      {
        title: 'Voitures',
        url: '/cars',
        icon: resourceIcons.cars,
      },
      {
        title: 'GPS Live Map',
        url: '/admin/gps/live-map',
        icon: resourceIcons.gpsLiveMap,
      },
      {
        title: 'GPS Alerts',
        url: '/admin/gps/alerts',
        icon: resourceIcons.gpsAlerts,
      },
    ];
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="w-full">
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Logo className="size-8" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeProject.title}
                  </span>
                  <span className="truncate text-xs">
                    {activeProject.subtitle}
                  </span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
