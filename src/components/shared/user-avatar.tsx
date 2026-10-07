import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Decorative initials. The person's name is always rendered next to it, so it's hidden from screen readers. */
export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-lagoon-tint text-[10px] leading-none font-semibold text-lagoon-dark",
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}

/** Avatar + name, the standard way to show who owns something. */
export function PersonName({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <UserAvatar name={name} />
      <span className="truncate">{name}</span>
    </span>
  );
}
