"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { hardNavigate } from "@/lib/navigation";
import { ApiError, checkAndSaveCorrections, createFromTranscript, type TranscriptOutcome } from "@/lib/api";
import type { Draft, TranscriptIssue, TranscriptSuccess } from "@/types/transcript";
import { buildCorrectionModel, type FixableIssue } from "./correction-model";
import { CorrectionResult } from "./correction-result";
import { ErrorResult, IdleResult, ResultPane, WorkingResult, type ErrorInfo } from "./result-pane";
import { SuccessResult } from "./success-result";
import { TranscriptPane } from "./transcript-pane";

/** One state for the whole screen (Architecture.md §11.3). No scattered boolean flags. */
type WorkspaceState =
  | { phase: "idle" }
  | { phase: "working" }
  | { phase: "success"; result: TranscriptSuccess }
  | {
      phase: "correction";
      draft: Draft;
      fixable: FixableIssue[];
      general: TranscriptIssue[];
      checking: boolean;
      checkError: string | null;
      round: number;
    }
  | { phase: "error"; error: ErrorInfo };

/** Maps server failures to the copy in Design.md §7. Every message says nothing was saved. */
function describeError(e: unknown): ErrorInfo {
  const status = e instanceof ApiError ? e.status : 0;
  const message = e instanceof Error ? e.message : "";
  switch (status) {
    case 400:
      return { title: "Paste a transcript to continue.", retry: false };
    case 403:
      return { title: "Only the administrator can create projects from a transcript.", retry: false };
    case 409:
      return { title: "A transcript is already being processed. Wait for it to finish.", retry: true };
    case 0:
      return {
        title: "NovaWorks couldn't reach the server.",
        detail: "Nothing was saved. Check your connection and try again.",
        retry: true,
      };
    case 422:
      return {
        title: "We couldn't read the AI's answer.",
        detail: "Nothing was saved. Try again, or check that the transcript is complete.",
        retry: true,
      };
    case 502:
    case 504:
      if (/understand|unreadable|parse|malformed|json/i.test(message)) {
        return {
          title: "We couldn't read the AI's answer.",
          detail: "Nothing was saved. Try again, or check that the transcript is complete.",
          retry: true,
        };
      }
      return { title: "The AI service didn't respond.", detail: "Nothing was saved. Try again.", retry: true };
    default:
      return {
        title: "The server couldn't finish creating the projects.",
        detail: "Nothing was saved. Try again.",
        retry: true,
      };
  }
}

export function TranscriptWorkspace() {
  const [transcript, setTranscript] = useState("");
  const [state, setState] = useState<WorkspaceState>({ phase: "idle" });
  // Guards against a double click landing before React re-renders the disabled button.
  const inFlight = useRef(false);

  const isEmpty = transcript.trim().length === 0;
  const editable = state.phase === "idle" || state.phase === "error";

  function applyOutcome(outcome: TranscriptOutcome, round: number) {
    if (outcome.kind === "success") {
      setState({ phase: "success", result: outcome.data });
      return;
    }
    const model = buildCorrectionModel(outcome.data.issues ?? [], outcome.data.draft);
    setState({
      phase: "correction",
      draft: model.draft,
      fixable: model.fixable,
      general: model.general,
      checking: false,
      checkError: null,
      round,
    });
  }

  function handleAuthLoss(e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      hardNavigate("/login");
      return true;
    }
    return false;
  }

  async function create() {
    if (inFlight.current || isEmpty) return;
    inFlight.current = true;
    setState({ phase: "working" });
    try {
      applyOutcome(await createFromTranscript(transcript), 0);
    } catch (e) {
      if (!handleAuthLoss(e)) setState({ phase: "error", error: describeError(e) });
    } finally {
      inFlight.current = false;
    }
  }

  async function checkAndSave() {
    if (inFlight.current || state.phase !== "correction") return;
    inFlight.current = true;
    const current = state;
    setState({ ...current, checking: true, checkError: null });
    try {
      applyOutcome(await checkAndSaveCorrections(current.draft), current.round + 1);
    } catch (e) {
      if (!handleAuthLoss(e)) {
        const info = describeError(e);
        setState({ ...current, checking: false, checkError: `${info.title} Nothing was saved.` });
      }
    } finally {
      inFlight.current = false;
    }
  }

  function startOver() {
    setTranscript("");
    setState({ phase: "idle" });
  }

  return (
    <>
      <PageHeader
        title="Create from transcript"
        description="Paste the full meeting transcript. Projects and tasks are created from the final decisions."
      />

      <div className="grid items-stretch gap-4 lg:grid-cols-2 lg:gap-6">
        <TranscriptPane
          value={transcript}
          onChange={setTranscript}
          readOnly={!editable}
          dimmed={state.phase === "working"}
          showEmptyHint={editable}
        />

        <ResultPane working={state.phase === "working"}>
          {state.phase === "idle" ? <IdleResult /> : null}
          {state.phase === "working" ? <WorkingResult /> : null}
          {state.phase === "success" ? <SuccessResult result={state.result} /> : null}
          {state.phase === "error" ? (
            <ErrorResult error={state.error} onRetry={create} canRetry={!isEmpty} />
          ) : null}
          {state.phase === "correction" ? (
            <CorrectionResult
              draft={state.draft}
              fixable={state.fixable}
              general={state.general}
              checking={state.checking}
              checkError={state.checkError}
              focusKey={state.round}
              onDraftChange={(draft) => setState({ ...state, draft })}
              onCheckAndSave={checkAndSave}
            />
          ) : null}
        </ResultPane>
      </div>

      <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        {state.phase === "idle" ? (
          <Button onClick={create} disabled={isEmpty} aria-describedby={isEmpty ? "transcript-meta" : undefined}>
            Create from transcript
          </Button>
        ) : null}
        {state.phase === "working" ? <Button disabled>Creating…</Button> : null}
        {state.phase === "success" ? (
          <Button variant="secondary" onClick={startOver}>
            Start a new transcript
          </Button>
        ) : null}
        {state.phase === "correction" ? (
          <Button variant="quiet" onClick={() => setState({ phase: "idle" })} disabled={state.checking}>
            Edit the transcript instead
          </Button>
        ) : null}
      </div>
    </>
  );
}
