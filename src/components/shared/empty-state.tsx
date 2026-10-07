import { cn } from "@/lib/utils";

/** Heading, one sentence, at most one action. No illustrations. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card border border-dashed border-line bg-surface px-6 py-12 sm:px-12", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="mt-2 max-w-[60ch] text-sm text-slate">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
