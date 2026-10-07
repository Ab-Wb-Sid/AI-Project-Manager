import { cn } from "@/lib/utils";

/** Project color marker. Always rendered next to the project name, so it's hidden from assistive tech. */
export function ProjectDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}

/** The 4px left edge used on project cards and group headers. */
export function ProjectRail({ color, className }: { color: string; className?: string }) {
  return (
    <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", className)} style={{ backgroundColor: color }} />
  );
}
