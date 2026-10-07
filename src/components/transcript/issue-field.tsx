"use client";

import { Check, ChevronRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { parseIsoDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Draft } from "@/types/transcript";
import type { TeamMember } from "@/types/user";
import {
  breadcrumb,
  fieldLabel,
  getValue,
  reasonFor,
  type FieldRef,
  type FixableIssue,
} from "./correction-model";

type OnChange = (ref: FieldRef, value: string | number | null) => void;

/** Breadcrumb, label, the right control for the field, and one plain-language reason. */
export function IssueField({
  issue,
  draft,
  team,
  resolved,
  disabled,
  onChange,
}: {
  issue: FixableIssue;
  draft: Draft;
  team: TeamMember[];
  resolved: boolean;
  disabled: boolean;
  onChange: OnChange;
}) {
  const id = `fix-${issue.key.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const reasonId = `${id}-reason`;
  const crumbs = breadcrumb(draft, issue.ref);

  return (
    <div
      id={`${id}-field`}
      data-issue={issue.key}
      className={cn(
        "rounded-control border-l-2 px-4 py-3 transition-colors",
        resolved ? "border-l-fern bg-surface" : "border-l-marigold bg-marigold-tint",
      )}
    >
      <p className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate">
        {crumbs.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 ? <ChevronRight aria-hidden className="size-3" /> : null}
            <span className={i === crumbs.length - 1 ? "text-ink" : undefined}>{c}</span>
          </span>
        ))}
      </p>

      {issue.afterProjectDeadline && issue.ref.level === "task" ? (
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <DateControl
            id={id}
            label="Due date"
            value={getValue(draft, issue.ref)}
            describedBy={reasonId}
            invalid={!resolved}
            disabled={disabled}
            onChange={(v) => onChange(issue.ref, v)}
          />
          <DateControl
            id={`${id}-project`}
            label="Project deadline"
            value={draft.projects?.[issue.ref.p]?.deadline}
            describedBy={reasonId}
            invalid={!resolved}
            disabled={disabled}
            onChange={(v) => onChange({ level: "project", p: issue.ref.p, field: "deadline" }, v)}
          />
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-medium">
            {fieldLabel(issue.ref)}
          </label>
          <Control
            id={id}
            issue={issue}
            draft={draft}
            team={team}
            describedBy={reasonId}
            invalid={!resolved}
            disabled={disabled}
            onChange={onChange}
          />
        </div>
      )}

      <p id={reasonId} className={cn("mt-2 text-sm", resolved ? "text-slate" : "text-ink")}>
        {resolved ? (
          <span className="inline-flex items-center gap-1.5 text-fern">
            <Check aria-hidden className="size-4" />
            Ready to check
          </span>
        ) : (
          reasonFor(draft, issue, team)
        )}
      </p>
    </div>
  );
}

function Control({
  id,
  issue,
  draft,
  team,
  describedBy,
  invalid,
  disabled,
  onChange,
}: {
  id: string;
  issue: FixableIssue;
  draft: Draft;
  team: TeamMember[];
  describedBy: string;
  invalid: boolean;
  disabled: boolean;
  onChange: OnChange;
}) {
  const { ref } = issue;
  const value = getValue(draft, ref);
  const common = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": invalid || undefined,
    disabled,
    className: "bg-surface",
  };

  if (ref.field === "assigneeId" || ref.field === "managerId") {
    const role = ref.field === "assigneeId" ? "AGENT" : "MANAGER";
    const people = team.filter((m) => m.role === role);
    const current = typeof value === "string" && people.some((m) => m.id === value) ? value : "";
    return (
      <Select {...common} value={current} onChange={(e) => onChange(ref, e.target.value || null)}>
        <option value="">{role === "AGENT" ? "Choose a developer" : "Choose a manager"}</option>
        {people.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.specialization ? ` — ${m.specialization}` : ""}
          </option>
        ))}
      </Select>
    );
  }

  if (ref.field === "deadline") {
    return (
      <DateControl
        id={id}
        value={value}
        describedBy={describedBy}
        invalid={invalid}
        disabled={disabled}
        onChange={(v) => onChange(ref, v)}
      />
    );
  }

  if (ref.field === "estimatedHours") {
    return (
      <Input
        {...common}
        type="number"
        inputMode="decimal"
        min={0.5}
        step={0.5}
        className="tabular max-w-40 bg-surface"
        value={typeof value === "number" && Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(ref, e.target.value === "" ? null : Number(e.target.value))}
      />
    );
  }

  return (
    <Input
      {...common}
      type="text"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(ref, e.target.value)}
    />
  );
}

function DateControl({
  id,
  label,
  value,
  describedBy,
  invalid,
  disabled,
  onChange,
}: {
  id: string;
  label?: string;
  value: unknown;
  describedBy: string;
  invalid: boolean;
  disabled: boolean;
  onChange: (value: string | null) => void;
}) {
  // A date input can only show real dates; an invalid AI value starts empty and is quoted in the reason.
  const current = typeof value === "string" && parseIsoDate(value) ? value : "";
  const input = (
    <Input
      id={id}
      type="date"
      min="2026-01-01"
      max="2026-12-31"
      className="tabular max-w-52 bg-surface"
      value={current}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || null)}
    />
  );
  if (!label) return input;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {input}
    </div>
  );
}
