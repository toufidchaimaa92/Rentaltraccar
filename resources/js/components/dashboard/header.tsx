import React from 'react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import Search from '@/components/dashboard/search'
import { ProfileDropdown } from '@/components/dashboard/profile-dropdown'
import ThemeToggle from '@/components/dashboard/theme-toggle'
import { AppBreadcrumb } from '@/components/dashboard/app-breadcrumb'

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      {/* Left section */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <AppBreadcrumb />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Search bar visible on medium screens and larger */}
        <div className="relative">
          <Search />
        </div>

        {/* Profile hidden on small screens */}
        <div className="hidden sm:block">
          <ProfileDropdown />
        </div>

        <ThemeToggle />
      </div>
    </header>
  )
}
