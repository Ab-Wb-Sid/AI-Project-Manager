"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBanner } from "@/components/shared/status-banner";
import { getTeam } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { Draft, TranscriptIssue } from "@/types/transcript";
import {
  breadcrumb,
  fieldLabel,
  isResolved,
  needsInputLabel,
  setValue,
  type FieldRef,
  type FixableIssue,
} from "./correction-model";
import { IssueField } from "./issue-field";

/**
 * Nothing was saved. Each unresolved field gets a control and a reason; "Check and save"
 * resends the corrected draft for server validation without calling the AI again.
 */
export function CorrectionResult({
  draft,
  fixable,
  general,
  checking,
  checkError,
  focusKey,
  onDraftChange,
  onCheckAndSave,
}: {
  draft: Draft;
  fixable: FixableIssue[];
  general: TranscriptIssue[];
  checking: boolean;
  checkError: string | null;
  /** Changes whenever a new set of issues arrives, so focus moves to the banner. */
  focusKey: number;
  onDraftChange: (draft: Draft) => void;
  onCheckAndSave: () => void;
}) {
  const team = useApi("team", getTeam);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bannerRef.current?.focus();
  }, [focusKey]);

  const members = team.data ?? [];
  const resolved = new Map(fixable.map((i) => [i.key, team.status === "ready" && isResolved(draft, i, members)]));
  const remaining = fixable.filter((i) => !resolved.get(i.key)).length + general.length;

  function change(ref: FieldRef, value: string | number | null) {
    onDraftChange(setValue(draft, ref, value));
  }

  function jumpTo(key: string) {
    const el = document.querySelector<HTMLElement>(`[data-issue="${CSS.escape(key)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.querySelector<HTMLElement>("input, select")?.focus({ preventScroll: true });
    el.classList.remove("animate-flash");
    void el.offsetWidth;
    el.classList.add("animate-flash");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div ref={bannerRef} tabIndex={-1} className="rounded-control outline-none focus-visible:outline-2">
        <StatusBanner
          tone={remaining > 0 ? "error" : "info"}
          title={
            remaining > 0
              ? `Nothing was saved. ${needsInputLabel(remaining)}`
              : "Nothing was saved yet. Every field is filled in."
          }
        >
          {remaining > 0
            ? "Fix the fields below, then check and save. The AI isn't asked again."
            : "Check and save to create the projects and tasks."}
        </StatusBanner>
      </div>

      {fixable.length > 1 ? (
        <nav aria-label="Fields that need input" className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {fixable.map((i) => (
              <li key={i.key}>
                <button
                  type="button"
                  onClick={() => jumpTo(i.key)}
                  className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors hover:border-lagoon hover:text-lagoon-dark"
                >
                  <span className="sr-only">Go to </span>
                  <span className="max-w-[16rem] truncate">
                    {fieldLabel(i.ref)} · {breadcrumb(draft, i.ref).at(-1)}
                  </span>
                  {resolved.get(i.key) ? (
                    <>
                      <Check aria-hidden className="ml-1.5 size-3.5 text-fern" />
                      <span className="sr-only">, ready</span>
                    </>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {general.length > 0 ? (
        <div className="mt-4 rounded-control border-l-2 border-l-marigold bg-marigold-tint px-4 py-3 text-sm">
          <p className="font-medium">These problems can&apos;t be fixed field by field:</p>
          <ul className="mt-1 list-disc pl-5 text-ink/85">
            {general.map((g, i) => (
              <li key={i}>
                {g.path === "projects" || g.path === ""
                  ? "No projects could be read from the transcript."
                  : `${g.path}: ${g.message}`}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-slate">Edit the transcript and create again.</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        {team.status === "loading"
          ? fixable.map((i) => <Skeleton key={i.key} className="h-28 w-full" />)
          : fixable.map((i) => (
              <IssueField
                key={i.key}
                issue={i}
                draft={draft}
                team={members}
                resolved={Boolean(resolved.get(i.key))}
                disabled={checking}
                onChange={change}
              />
            ))}
      </div>

      {checkError ? (
        <StatusBanner tone="error" title={checkError} className="mt-4">
          Your corrections are kept. Try again.
        </StatusBanner>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={onCheckAndSave} disabled={checking || fixable.length === 0}>
          {checking ? "Checking…" : "Check and save"}
        </Button>
      </div>
    </div>
  );
}
