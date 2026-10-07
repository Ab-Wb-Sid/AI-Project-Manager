/**
 * DEVELOPMENT-ONLY mock of the backend HTTP contract (Abdul Wahab / Saad Faisal docs, §5).
 *
 * Enabled only with NEXT_PUBLIC_USE_MOCK_API=true so the UI can be built and reviewed before
 * the real API routes exist. It is NOT the AI flow: it never reads the transcript's content
 * beyond a few `[mock:…]` switches, and the real app always calls POST /api/transcript/create.
 *
 * Transcript switches for exercising UI states:
 *   [mock:422]        → validation issues (unknown person + bad date), nothing saved
 *   [mock:502]        → AI service failure
 *   [mock:unreadable] → unreadable AI output
 *   [mock:409]        → another conversion already running
 */
import type { Transport } from "../api";
import type { Draft } from "@/types/transcript";
import type { Role } from "@/types/user";

type MockUser = { id: string; name: string; email: string; role: Role; specialization: string };
type MockTask = {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  deadline: string;
  estimatedHours: number;
};
type MockProject = {
  id: string;
  name: string;
  clientName: string;
  description: string;
  managerId: string;
  deadline: string;
  tasks: MockTask[];
};

const USERS: MockUser[] = [
  { id: "ADMIN", name: "Admin", email: "admin@novaworks.example", role: "ADMIN", specialization: "Administrator" },
  { id: "PM01", name: "Ayesha Khan", email: "ayesha@novaworks.example", role: "MANAGER", specialization: "Web PM" },
  { id: "PM02", name: "Bilal Ahmed", email: "bilal@novaworks.example", role: "MANAGER", specialization: "Mobile PM" },
  { id: "PM03", name: "Hina Malik", email: "hina@novaworks.example", role: "MANAGER", specialization: "AI PM" },
  { id: "DEV01", name: "Ali Raza", email: "ali@novaworks.example", role: "AGENT", specialization: "Full-Stack" },
  { id: "DEV02", name: "Hamza Shah", email: "hamza@novaworks.example", role: "AGENT", specialization: "Full-Stack" },
  { id: "DEV03", name: "Sara Noor", email: "sara@novaworks.example", role: "AGENT", specialization: "App Developer" },
  { id: "DEV04", name: "Usman Tariq", email: "usman@novaworks.example", role: "AGENT", specialization: "App Developer" },
  { id: "DEV05", name: "Zain Abbas", email: "zain@novaworks.example", role: "AGENT", specialization: "AI Developer" },
  { id: "DEV06", name: "Maryam Asif", email: "maryam@novaworks.example", role: "AGENT", specialization: "AI Developer" },
];

const NOTE = "Mock data for frontend development.";
// [title, assigneeId, deadline, hours]
type Row = [string, string, string, number];
const FIXTURE: { name: string; clientName: string; managerId: string; deadline: string; tasks: Row[] }[] = [
  {
    name: "UrbanCart Website", clientName: "UrbanCart Clothing", managerId: "PM01", deadline: "2026-10-20",
    tasks: [
      ["Product catalog UI", "DEV01", "2026-10-12", 12],
      ["Demo cart UI", "DEV01", "2026-10-15", 8],
      ["Product and cart APIs", "DEV02", "2026-10-14", 14],
      ["Website integration and testing", "DEV01", "2026-10-19", 6],
    ],
  },
  {
    name: "QuickServe Mobile App", clientName: "QuickServe Services", managerId: "PM02", deadline: "2026-10-24",
    tasks: [
      ["Login and profile screens", "DEV03", "2026-10-12", 8],
      ["Service booking screens", "DEV03", "2026-10-17", 12],
      ["Booking and account APIs", "DEV02", "2026-10-16", 16],
      ["Mobile integration and testing", "DEV04", "2026-10-22", 10],
    ],
  },
  {
    name: "HelpDeskPro AI Assistant", clientName: "HelpDeskPro Solutions", managerId: "PM03", deadline: "2026-10-22",
    tasks: [
      ["FAQ document processing", "DEV06", "2026-10-13", 10],
      ["Assistant answer generation", "DEV05", "2026-10-17", 14],
      ["Human escalation flow", "DEV05", "2026-10-18", 6],
      ["Assistant evaluation and testing", "DEV06", "2026-10-21", 8],
    ],
  },
];

const SESSION_KEY = "nw-mock-session";
const DB_KEY = "nw-mock-projects";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the mock simply won't persist */
  }
}

let counter = 0;
const newId = () => `c${Date.now().toString(36)}${(counter++).toString(36).padStart(4, "0")}`;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ok = (data: unknown, status = 200) => ({ status, data });
const fail = (status: number, error: string, extra?: object) => ({ status, data: { error, ...extra } });
const ref = (id: string) => {
  const u = USERS.find((x) => x.id === id);
  return { id, name: u?.name ?? id };
};

function currentUser() {
  const id = read<string | null>(SESSION_KEY, null);
  return USERS.find((u) => u.id === id) ?? null;
}

function visibleProjects(user: MockUser) {
  const all = read<MockProject[]>(DB_KEY, []);
  if (user.role === "ADMIN") return all;
  if (user.role === "MANAGER") return all.filter((p) => p.managerId === user.id);
  return all.filter((p) => p.tasks.some((t) => t.assigneeId === user.id));
}

function visibleTasks(user: MockUser, p: MockProject) {
  return user.role === "AGENT" ? p.tasks.filter((t) => t.assigneeId === user.id) : p.tasks;
}

function summary(user: MockUser, p: MockProject) {
  const tasks = visibleTasks(user, p);
  return {
    id: p.id,
    name: p.name,
    clientName: p.clientName,
    description: p.description,
    deadline: p.deadline,
    manager: ref(p.managerId),
    taskCount: tasks.length,
    totalHours: tasks.reduce((n, t) => n + t.estimatedHours, 0),
  };
}

function validDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function validateDraft(draft: Draft) {
  const issues: { path: string; message: string }[] = [];
  const projects = draft.projects ?? [];
  if (projects.length === 0) issues.push({ path: "projects", message: "Array must contain at least 1 element(s)" });
  projects.forEach((p, pi) => {
    const pp = `projects.${pi}`;
    if (!p.name) issues.push({ path: `${pp}.name`, message: "Required" });
    if (!p.clientName) issues.push({ path: `${pp}.clientName`, message: "Required" });
    if (USERS.find((u) => u.id === p.managerId)?.role !== "MANAGER")
      issues.push({ path: `${pp}.managerId`, message: `"${p.managerId}" is not a known manager` });
    if (!validDate(p.deadline))
      issues.push({ path: `${pp}.deadline`, message: `"${p.deadline}" is not a valid calendar date` });
    (p.tasks ?? []).forEach((t, ti) => {
      const tp = `${pp}.tasks.${ti}`;
      if (!t.title) issues.push({ path: `${tp}.title`, message: "Required" });
      if (USERS.find((u) => u.id === t.assigneeId)?.role !== "AGENT")
        issues.push({ path: `${tp}.assigneeId`, message: `"${t.assigneeId}" is not a known developer` });
      if (!(typeof t.estimatedHours === "number" && t.estimatedHours > 0))
        issues.push({ path: `${tp}.estimatedHours`, message: "Number must be greater than 0" });
      if (!validDate(t.deadline))
        issues.push({ path: `${tp}.deadline`, message: `"${t.deadline}" is not a valid calendar date` });
      else if (validDate(p.deadline) && t.deadline > p.deadline)
        issues.push({ path: `${tp}.deadline`, message: `is after the project deadline ${p.deadline}` });
    });
  });
  return issues;
}

function saveDraft(draft: Draft) {
  const all = read<MockProject[]>(DB_KEY, []);
  const created = (draft.projects ?? []).map((p) => ({
    id: newId(),
    name: p.name!,
    clientName: p.clientName!,
    description: p.description ?? "",
    managerId: p.managerId!,
    deadline: p.deadline!,
    tasks: (p.tasks ?? []).map((t) => ({
      id: newId(),
      title: t.title!,
      description: t.description ?? "",
      assigneeId: t.assigneeId!,
      deadline: t.deadline!,
      estimatedHours: t.estimatedHours!,
    })),
  }));
  write(DB_KEY, [...all, ...created]);
  return {
    created: {
      projectCount: created.length,
      taskCount: created.reduce((n, p) => n + p.tasks.length, 0),
      projects: created.map((p) => ({
        id: p.id,
        name: p.name,
        taskCount: p.tasks.length,
        totalHours: p.tasks.reduce((n, t) => n + t.estimatedHours, 0),
      })),
    },
  };
}

function fixtureDraft(): Draft {
  return {
    projects: FIXTURE.map((p) => ({
      name: p.name,
      clientName: p.clientName,
      description: NOTE,
      managerId: p.managerId,
      deadline: p.deadline,
      tasks: p.tasks.map(([title, assigneeId, deadline, estimatedHours]) => ({
        title,
        description: NOTE,
        assigneeId,
        deadline,
        estimatedHours,
      })),
    })),
  };
}

export const mockTransport: Transport = async (method, path, body) => {
  await delay(250);
  const b = (body ?? {}) as Record<string, unknown>;

  if (method === "POST" && path === "/api/auth/login") {
    const email = String(b.email ?? "").trim().toLowerCase();
    const user = USERS.find((u) => u.email === email);
    if (!user || b.password !== "Demo123!") return fail(401, "Invalid credentials");
    write(SESSION_KEY, user.id);
    return ok({ user: { id: user.id, name: user.name, role: user.role } });
  }
  if (method === "POST" && path === "/api/auth/logout") {
    write(SESSION_KEY, null);
    return ok(null, 204);
  }

  const user = currentUser();
  if (!user) return fail(401, "Not authenticated");

  if (method === "GET" && path === "/api/me") {
    return ok({ id: user.id, name: user.name, role: user.role, specialization: user.specialization });
  }
  if (method === "GET" && path === "/api/team") {
    return ok(USERS.map(({ id, name, role, specialization }) => ({ id, name, role, specialization })));
  }
  if (method === "GET" && path === "/api/projects") {
    return ok(visibleProjects(user).map((p) => summary(user, p)));
  }
  const detail = path.match(/^\/api\/projects\/([^/]+)$/);
  if (method === "GET" && detail) {
    const id = decodeURIComponent(detail[1]);
    const p = visibleProjects(user).find((x) => x.id === id);
    if (!p) return fail(404, "Not found");
    return ok({
      ...summary(user, p),
      tasks: visibleTasks(user, p).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        deadline: t.deadline,
        estimatedHours: t.estimatedHours,
        assignee: ref(t.assigneeId),
      })),
    });
  }
  if (method === "GET" && path === "/api/my-tasks") {
    if (user.role !== "AGENT") return fail(403, "Agents only");
    return ok(
      visibleProjects(user).flatMap((p) =>
        visibleTasks(user, p).map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          deadline: t.deadline,
          estimatedHours: t.estimatedHours,
          project: { id: p.id, name: p.name, clientName: p.clientName, manager: ref(p.managerId) },
        })),
      ),
    );
  }
  if (method === "POST" && path === "/api/transcript/create") {
    if (user.role !== "ADMIN") return fail(403, "Forbidden");
    let draft: Draft;
    if (b.draft !== undefined) {
      draft = b.draft as Draft;
    } else {
      const transcript = typeof b.transcript === "string" ? b.transcript.trim() : "";
      if (!transcript) return fail(400, "Transcript is empty");
      await delay(2500);
      if (transcript.includes("[mock:502]")) return fail(502, "AI service unavailable, try again");
      if (transcript.includes("[mock:unreadable]")) return fail(502, "Could not understand AI output, try again");
      if (transcript.includes("[mock:409]")) return fail(409, "A conversion is already running");
      draft = fixtureDraft();
      if (transcript.includes("[mock:422]")) {
        draft.projects![1].tasks![3].assigneeId = "Kamran";
        draft.projects![2].deadline = "2026-10-32";
        draft.projects![0].tasks![1].estimatedHours = 0;
      }
    }
    const issues = validateDraft(draft);
    if (issues.length) return fail(422, "Validation failed", { issues, draft });
    return ok(saveDraft(draft), 201);
  }

  return fail(404, "Not found");
};
