"use client";

import { ChevronDown, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { roleLine } from "@/lib/format";
import type { User } from "@/types/user";
import { useLogout } from "./use-logout";

export function AccountMenu({ user }: { user: User }) {
  const { logout, pending } = useLogout();
  const line = roleLine(user.role, user.specialization);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="flex h-10 items-center gap-2.5 rounded-control px-2 text-left transition-colors hover:bg-paper data-[state=open]:bg-paper">
        <UserAvatar name={user.name} className="size-7 text-[11px]" />
        <span className="hidden flex-col leading-tight md:flex">
          <span className="text-sm font-medium text-ink">{user.name}</span>
          <span className="text-xs font-normal text-slate">{line}</span>
        </span>
        <span className="sr-only md:hidden">
          {user.name}, {line}. Account menu
        </span>
        <ChevronDown aria-hidden className="size-4 text-slate" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="md:hidden">
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="block text-xs text-slate">{line}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="md:hidden" />
        <DropdownMenuItem disabled={pending} onSelect={() => void logout()}>
          <LogOut aria-hidden />
          {pending ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
