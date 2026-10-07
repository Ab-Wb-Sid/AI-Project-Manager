import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Wordmark } from "@/components/layout/app-bar";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <Wordmark />
      <h1 className="mt-10 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-slate">It may not exist, or it isn&apos;t one of yours.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-control text-sm font-medium text-lagoon hover:text-lagoon-dark"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Back to your projects
      </Link>
    </main>
  );
}
