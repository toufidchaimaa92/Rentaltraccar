import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';

import { AppCommand } from '@/components/dashboard/app-command';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { ThemeProvider } from '@/components/dashboard/theme-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/dashboard/header';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { props } = usePage(); // <- get shared props from middleware

  useEffect(() => {
    const flash = (props as any)?.flash || {};
    if (flash.success) toast.success(flash.success);
    if (flash.error) toast.error(flash.error);
  }, [props?.flash]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <div className="flex flex-1 flex-col gap-4 px-2 sm:px-4 lg:px-8 pt-6">
          {children}</div>
        </SidebarInset>

        {/* Sonner toaster should live once, here */}
        <Toaster richColors position="top-right" />

        <AppCommand />
      </SidebarProvider>
    </ThemeProvider>
  );
}
