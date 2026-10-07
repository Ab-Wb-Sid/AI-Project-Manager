import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Same page for "doesn't exist" and "isn't yours", so nothing hints at who owns a project.
 */
export function NotFoundPanel({ backHref = "/", title = "Project not found" }: { backHref?: string; title?: string }) {
  return (
    <div className="max-w-xl py-8">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-slate">It may not exist, or it isn&apos;t one of yours.</p>
      <Link
        href={backHref}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-control text-sm font-medium text-lagoon hover:text-lagoon-dark"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Back to your projects
      </Link>
    </div>
  );
}
