import { cn } from "@/lib/utils";

/** Static placeholder block. No shimmer: motion is reserved for the transcript flow. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden className={cn("rounded-control bg-line/60", className)} {...props} />;
}

export { Skeleton };
