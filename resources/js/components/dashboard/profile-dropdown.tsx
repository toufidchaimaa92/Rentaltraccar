'use client';

import React from 'react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lock, LogOut } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export const ProfileDropdown = () => {
  const { auth } = usePage<PageProps>().props;
  const user = auth.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="h-8 w-8 rounded-lg cursor-pointer">
          <AvatarImage
            src={user.profile_photo_url}
            alt={user.name}
          />
          <AvatarFallback className="rounded-lg">
            {user.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link
            href={route('security.show')}
            className="flex w-full items-center gap-2"
          >
            <Lock className="size-4" />
            Security
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={route('logout')}
            method="post"
            as="button"
            className="flex w-full items-center gap-2 text-red-500"
          >
            <LogOut className="size-4 text-red-500" />
            Logout
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
