"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/shared/status-banner";
import { cn } from "@/lib/utils";

/** "What was decided." Frame for every result state; the working bar runs along its top edge. */
export function ResultPane({ working, children }: { working: boolean; children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="result-heading"
      aria-busy={working}
      className="relative flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface"
    >
      {working ? (
        <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-lagoon-tint motion-reduce:hidden">
          <div className="h-full w-2/5 animate-indeterminate bg-lagoon" />
        </div>
      ) : null}
      <div className="border-b border-line px-5 py-3">
        <h2 id="result-heading" className="text-lg font-semibold">
          Result
        </h2>
      </div>
      <div className="flex flex-1 flex-col p-5">{children}</div>
    </section>
  );
}

export function IdleResult() {
  return (
    <div className="flex flex-1 flex-col justify-center py-10 lg:py-0">
      <p className="text-base font-medium">Nothing created yet.</p>
      <p className="mt-1 max-w-[42ch] text-sm text-slate">
        The result appears here after you click Create from transcript.
      </p>
    </div>
  );
}

export function WorkingResult() {
  const seconds = useElapsedSeconds();
  return (
    <div className="flex flex-1 flex-col justify-center py-10 lg:py-0">
      <p role="status" className="sr-only">
        Creating projects and tasks
      </p>
      <p className="hidden text-sm font-medium text-lagoon motion-reduce:block">Working…</p>
      <p className="max-w-[44ch] text-base text-ink">
        Reading the transcript and matching people from the team directory…
      </p>
      <p className="tabular mt-2 text-xs text-slate" aria-hidden>
        {seconds < 2 ? "Started just now" : `${seconds} seconds`} · This usually takes 10 to 60 seconds.
      </p>
    </div>
  );
}

function useElapsedSeconds() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return seconds;
}

export interface ErrorInfo {
  title: string;
  detail?: string;
  /** Some errors (e.g. "only the administrator…") can't be fixed by retrying. */
  retry: boolean;
}

export function ErrorResult({ error, onRetry, canRetry }: { error: ErrorInfo; onRetry: () => void; canRetry: boolean }) {
  return (
    <div className={cn("flex flex-1 flex-col justify-start")}>
      <StatusBanner
        tone="error"
        title={error.title}
        action={
          error.retry ? (
            <Button onClick={onRetry} disabled={!canRetry}>
              Try again
            </Button>
          ) : undefined
        }
      >
        {error.detail}
      </StatusBanner>
      <p className="mt-4 text-sm text-slate">The transcript is still on the left. You can edit it before trying again.</p>
    </div>
  );
}
