'use client';

import {
    ChevronsUpDown,
    LogOut,
    Moon,
    Palette,
    Sun,
    Monitor,
    ShieldCheck,
    Users,
    FileText,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { User } from '@/types';
import { Link } from '@inertiajs/react';
import { useTheme } from '@/components/dashboard/theme-provider';

export function NavUser({ user }: { user: User }) {
    const { isMobile } = useSidebar();
    const { setTheme } = useTheme();
    const userIdentifier = user.email || user.phone || '—';

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    alt={user.name}
                                    src={user.profile_photo_url}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {user.name}
                                </span>
                                <span className="truncate text-xs">
                                    {userIdentifier}
                                </span>
                            </div>

                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        {/* THEME */}
                        <DropdownMenuGroup>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="flex w-full items-center gap-2">
                                    <Palette className="size-4 text-muted-foreground" />
                                    Theme
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem onClick={() => setTheme('light')}>
                                            <Sun />
                                            <span>Light</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme('dark')}>
                                            <Moon />
                                            <span>Dark</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme('system')}>
                                            <Monitor />
                                            <span>System</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        {/* ACCOUNT / ADMIN */}
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link
                                    href={route('security.show')}
                                    className="flex w-full items-center gap-2"
                                >
                                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                    <span>Sécurité</span>
                                </Link>
                            </DropdownMenuItem>

                            {user.role === 'admin' && (
                                <>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/admin/users"
                                            className="flex w-full items-center gap-2"
                                        >
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span>Utilisateurs</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/admin/pdf-templates"
                                            className="flex w-full items-center gap-2"
                                        >
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span>PDF Templates</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />

                        {/* LOGOUT */}
                        <DropdownMenuItem className="focus:bg-destructive/10">
                            <Link
                                className="flex w-full items-center gap-2 text-destructive"
                                href={route('logout')}
                                method="post"
                                as="button"
                            >
                                <LogOut className="h-4 w-4 text-destructive" />
                                <span className="text-destructive">Log out</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
