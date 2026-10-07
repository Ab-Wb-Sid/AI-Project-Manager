import { Skeleton } from "@/components/ui/skeleton";

/** Neutral placeholder while the session loads, before the page knows which view to show. */
export function PageSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-32" />
      <Skeleton className="mt-8 h-40 w-full rounded-card" />
    </div>
  );
}
