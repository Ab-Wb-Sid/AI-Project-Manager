"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { NAVIGATION } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { AccountMenu } from "./account-menu";
import { MobileNav } from "./mobile-nav";
import { isActive } from "./nav-links";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-base font-semibold tracking-[-0.01em] text-ink", className)}>
      <span aria-hidden className="inline-flex size-5 items-end gap-[2px] rounded-[5px] bg-lagoon p-[4px]">
        <span className="h-1.5 w-[3px] rounded-[1px] bg-white/70" />
        <span className="h-full w-[3px] rounded-[1px] bg-white" />
      </span>
      NovaWorks
    </span>
  );
}

/** 56px top bar. Links are role-specific; a role never sees links it can't use. */
export function AppBar({ user }: { user: User }) {
  const pathname = usePathname();
  const items = NAVIGATION[user.role];
  const links = items.filter((i) => !i.primary);
  const primary = items.find((i) => i.primary);

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-surface">
      <div className="mx-auto flex h-full max-w-[1168px] items-center gap-2 px-4 sm:px-6">
        <Link href="/" className="mr-4 rounded-control py-1 sm:mr-6" aria-label="NovaWorks home">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
          {links.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-control px-3 text-sm font-medium transition-colors",
                  active ? "bg-lagoon-tint text-lagoon-dark" : "text-slate hover:bg-paper hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* The page itself owns the primary action while it's open, so the bar shows a plain active link. */}
          {primary && pathname === primary.href ? (
            <Link
              href={primary.href}
              aria-current="page"
              className="hidden h-10 items-center rounded-control bg-lagoon-tint px-3 text-sm font-medium text-lagoon-dark sm:inline-flex"
            >
              {primary.label}
            </Link>
          ) : primary ? (
            <Button asChild className="hidden sm:inline-flex">
              <Link href={primary.href}>{primary.label}</Link>
            </Button>
          ) : null}
          <div className="hidden sm:block">
            <AccountMenu user={user} />
          </div>
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}
