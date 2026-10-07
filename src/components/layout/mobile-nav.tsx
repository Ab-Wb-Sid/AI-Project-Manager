"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { NAVIGATION } from "@/lib/constants";
import { roleLine } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { isActive } from "./nav-links";
import { useLogout } from "./use-logout";

/** Under 640px the top-bar links collapse into this sheet: navigation, account, Log out. */
export function MobileNav({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { logout, pending } = useLogout();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="quiet" size="icon" className="text-ink sm:hidden" aria-label="Open menu">
          <Menu className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex items-center gap-3 border-b border-line px-4 pt-4 pb-4">
          <UserAvatar name={user.name} className="size-9 text-xs" />
          <div className="min-w-0 pr-10">
            <SheetTitle className="truncate">{user.name}</SheetTitle>
            <SheetDescription>{roleLine(user.role, user.specialization)}</SheetDescription>
          </div>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 p-2">
          {NAVIGATION[user.role].map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center rounded-control px-3 text-base font-medium transition-colors",
                  active ? "bg-lagoon-tint text-lagoon-dark" : "text-ink hover:bg-paper",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-line p-2">
          <button
            type="button"
            onClick={() => void logout()}
            disabled={pending}
            className="flex h-11 w-full items-center gap-2 rounded-control px-3 text-base font-medium text-ink transition-colors hover:bg-paper disabled:opacity-50"
          >
            <LogOut aria-hidden className="size-4 text-slate" />
            {pending ? "Logging out…" : "Log out"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
