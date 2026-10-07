/**
 * Turns a 422 response ({ issues, draft }) into editable fields.
 *
 * The server is the authority: these checks only drive the "{n} fields need your input" count
 * and per-field hints. "Check and save" always sends the edited draft back for real validation.
 */
import { formatDate, parseIsoDate } from "@/lib/format";
import type { Draft, DraftProject, DraftTask, TranscriptIssue } from "@/types/transcript";
import type { TeamMember } from "@/types/user";

export type ProjectField = "name" | "clientName" | "managerId" | "deadline";
export type TaskField = "title" | "assigneeId" | "deadline" | "estimatedHours";

export type FieldRef =
  | { level: "project"; p: number; field: ProjectField }
  | { level: "task"; p: number; t: number; field: TaskField };

export interface FixableIssue {
  key: string;
  ref: FieldRef;
  /** What the AI returned, kept for the explanation even after the admin edits the field. */
  original: unknown;
  serverMessage: string;
  /** The task is due after its project: both dates are offered. */
  afterProjectDeadline: boolean;
}

export interface CorrectionModel {
  draft: Draft;
  fixable: FixableIssue[];
  /** Problems that no single field can fix (e.g. no projects at all). */
  general: TranscriptIssue[];
}

const PROJECT_FIELDS: ProjectField[] = ["name", "clientName", "managerId", "deadline"];
const TASK_FIELDS: TaskField[] = ["title", "assigneeId", "deadline", "estimatedHours"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Copies the raw draft into a predictable shape without inventing values. */
function normalizeDraft(raw: unknown): Draft {
  const projects = isRecord(raw) && Array.isArray(raw.projects) ? raw.projects : [];
  return {
    projects: projects.map((p): DraftProject => {
      const rp = isRecord(p) ? p : {};
      const tasks = Array.isArray(rp.tasks) ? rp.tasks : [];
      return {
        ...rp,
        tasks: tasks.map((t): DraftTask => (isRecord(t) ? { ...t } : {})),
      } as DraftProject;
    }),
  };
}

/** "projects.2.tasks.1.assigneeId" (or "projects[2].tasks[1].assigneeId") → a field reference. */
export function parseIssuePath(path: string): FieldRef | null {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  if (parts[0] !== "projects" || parts.length < 3) return null;
  const p = Number(parts[1]);
  if (!Number.isInteger(p)) return null;
  if (parts.length === 3 && PROJECT_FIELDS.includes(parts[2] as ProjectField)) {
    return { level: "project", p, field: parts[2] as ProjectField };
  }
  if (parts[2] === "tasks" && parts.length === 5) {
    const t = Number(parts[3]);
    if (Number.isInteger(t) && TASK_FIELDS.includes(parts[4] as TaskField)) {
      return { level: "task", p, t, field: parts[4] as TaskField };
    }
  }
  return null;
}

export function getValue(draft: Draft, ref: FieldRef): unknown {
  const project = draft.projects?.[ref.p];
  if (!project) return undefined;
  if (ref.level === "project") return project[ref.field];
  return project.tasks?.[ref.t]?.[ref.field];
}

/** Immutable update of one field. */
export function setValue(draft: Draft, ref: FieldRef, value: string | number | null): Draft {
  const projects = (draft.projects ?? []).map((project, pi) => {
    if (pi !== ref.p) return project;
    if (ref.level === "project") return { ...project, [ref.field]: value };
    return {
      ...project,
      tasks: (project.tasks ?? []).map((task, ti) => (ti === ref.t ? { ...task, [ref.field]: value } : task)),
    };
  });
  return { ...draft, projects };
}

export function buildCorrectionModel(issues: TranscriptIssue[], rawDraft: unknown): CorrectionModel {
  const draft = normalizeDraft(rawDraft);
  const seen = new Set<string>();
  const fixable: FixableIssue[] = [];
  const general: TranscriptIssue[] = [];

  for (const issue of issues) {
    const ref = parseIssuePath(issue.path);
    const project = ref ? draft.projects?.[ref.p] : undefined;
    const exists = ref && project && (ref.level === "project" || project.tasks?.[ref.t] !== undefined);
    if (!ref || !exists) {
      general.push(issue);
      continue;
    }
    const key = issue.path;
    if (seen.has(key)) continue;
    seen.add(key);
    fixable.push({
      key,
      ref,
      original: getValue(draft, ref),
      serverMessage: issue.message,
      afterProjectDeadline: ref.level === "task" && ref.field === "deadline" && /after the project deadline/i.test(issue.message),
    });
  }
  return { draft, fixable, general };
}

/* ---------- Local checks (UX only) ---------- */

function roleOf(team: TeamMember[], id: unknown) {
  return typeof id === "string" ? team.find((m) => m.id === id)?.role : undefined;
}

export function isResolved(draft: Draft, issue: FixableIssue, team: TeamMember[]): boolean {
  const value = getValue(draft, issue.ref);
  const { ref } = issue;
  switch (ref.field) {
    case "assigneeId":
      return roleOf(team, value) === "AGENT";
    case "managerId":
      return roleOf(team, value) === "MANAGER";
    case "estimatedHours":
      return typeof value === "number" && Number.isFinite(value) && value > 0;
    case "deadline": {
      if (typeof value !== "string" || !parseIsoDate(value)) return false;
      if (ref.level === "task") {
        const projectDeadline = draft.projects?.[ref.p]?.deadline;
        if (typeof projectDeadline === "string" && parseIsoDate(projectDeadline) && value > projectDeadline) return false;
      }
      return true;
    }
    default:
      return typeof value === "string" && value.trim().length > 0;
  }
}

/* ---------- Plain-language copy (Design.md §7) ---------- */

export function fieldLabel(ref: FieldRef) {
  if (ref.level === "project") {
    return { name: "Project name", clientName: "Client", managerId: "Manager", deadline: "Project deadline" }[ref.field];
  }
  return { title: "Task title", assigneeId: "Assigned to", deadline: "Due date", estimatedHours: "Estimated hours" }[
    ref.field
  ];
}

export function breadcrumb(draft: Draft, ref: FieldRef) {
  const project = draft.projects?.[ref.p];
  const projectName = (typeof project?.name === "string" && project.name.trim()) || `Project ${ref.p + 1}`;
  if (ref.level === "project") return [projectName];
  const task = project?.tasks?.[ref.t];
  const taskTitle = (typeof task?.title === "string" && task.title.trim()) || `Task ${ref.t + 1}`;
  return [projectName, taskTitle];
}

function shown(value: unknown) {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value);
}

export function reasonFor(draft: Draft, issue: FixableIssue, team: TeamMember[]) {
  const { ref } = issue;
  const original = shown(issue.original);

  if (ref.field === "assigneeId" || ref.field === "managerId") {
    const want = ref.field === "assigneeId" ? "developer" : "manager";
    if (!original) {
      return ref.field === "assigneeId"
        ? "The transcript doesn't say who owns this task. Choose a developer."
        : "The transcript doesn't say who manages this project. Choose a manager.";
    }
    const person = team.find((m) => m.id === original);
    if (person) return `${person.name} isn't a ${want}. Choose a ${want}.`;
    return `We couldn't match "${original}" to anyone on the team. Choose a ${want}.`;
  }

  if (ref.field === "estimatedHours") return "Estimated hours must be more than 0.";

  if (ref.field === "deadline") {
    if (issue.afterProjectDeadline) {
      const projectDeadline = draft.projects?.[ref.p]?.deadline;
      return `This task is due after the project deadline (${formatDate(shown(projectDeadline))}). Change one of the dates.`;
    }
    if (!original) return "The transcript doesn't give a clear date. Choose one.";
    const year = issue.serverMessage.match(/not in (\d{4})/i)?.[1];
    if (parseIsoDate(original) && year) {
      return `${formatDate(original)} isn't in ${year}. Choose a date in ${year}.`;
    }
    return `${original} isn't a valid date. Use YYYY-MM-DD.`;
  }

  return "This wasn't clear in the transcript. Add it here.";
}

export function needsInputLabel(n: number) {
  return n === 1 ? "1 field needs your input." : `${n} fields need your input.`;
}
