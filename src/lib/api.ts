/**
 * The only place the frontend talks to the server. Components never call fetch() directly.
 *
 * Identity always comes from the session cookie the server sets at login; nothing here sends
 * a role or user id for authorization. The server scopes every response.
 */
import type { ProjectDetail, ProjectSummary } from "@/types/project";
import type { MyTask } from "@/types/task";
import type { Draft, TranscriptCorrection, TranscriptSuccess } from "@/types/transcript";
import type { Role, TeamMember, User } from "@/types/user";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST";
export type Transport = (method: Method, path: string, body?: unknown) => Promise<{ status: number; data: unknown }>;

const httpTransport: Transport = async (method, path, body) => {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Network failure or the dev server is down. Status 0 means "no response".
    return { status: 0, data: null };
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  return { status: res.status, data };
};

/**
 * Development-only mock, used when NEXT_PUBLIC_USE_MOCK_API=true and the backend isn't running.
 * It is loaded lazily from its own module so it never ships in the normal bundle path.
 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
let transportPromise: Promise<Transport> | null = null;
function getTransport() {
  transportPromise ??= USE_MOCK
    ? import("./mock/mock-transport").then((m) => m.mockTransport)
    : Promise.resolve(httpTransport);
  return transportPromise;
}

function errorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return data.error;
  }
  return fallback;
}

async function call(method: Method, path: string, body?: unknown) {
  const transport = await getTransport();
  return transport(method, path, body);
}

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const { status, data } = await call(method, path, body);
  if (status >= 200 && status < 300) return data as T;
  throw new ApiError(status, errorMessage(data, `Request failed (${status})`), data);
}

/* ---------- Auth ---------- */

export function login(email: string, password: string) {
  return request<{ user: { id: string; name: string; role: Role } }>("POST", "/api/auth/login", {
    email,
    password,
  });
}

export function logout() {
  return request<null>("POST", "/api/auth/logout");
}

export function getCurrentUser() {
  return request<User>("GET", "/api/me");
}

/* ---------- Reads (server-scoped) ---------- */

export function getTeam() {
  return request<TeamMember[]>("GET", "/api/team");
}

export function getProjects() {
  return request<ProjectSummary[]>("GET", "/api/projects");
}

export function getProject(id: string) {
  return request<ProjectDetail>("GET", `/api/projects/${encodeURIComponent(id)}`);
}

export function getMyTasks() {
  return request<MyTask[]>("GET", "/api/my-tasks");
}

/* ---------- Transcript (admin only; the server enforces it) ---------- */

export type TranscriptOutcome =
  | { kind: "success"; data: TranscriptSuccess }
  | { kind: "correction"; data: TranscriptCorrection };

async function postTranscript(body: { transcript: string } | { draft: Draft }): Promise<TranscriptOutcome> {
  const { status, data } = await call("POST", "/api/transcript/create", body);
  if (status >= 200 && status < 300) return { kind: "success", data: data as TranscriptSuccess };
  if (status === 422 && data && typeof data === "object" && "issues" in data) {
    return { kind: "correction", data: data as TranscriptCorrection };
  }
  throw new ApiError(status, errorMessage(data, `Request failed (${status})`), data);
}

/** Sends the transcript to the server, which calls the AI, validates, and saves in one transaction. */
export function createFromTranscript(transcript: string) {
  return postTranscript({ transcript });
}

/** Resubmits a corrected draft. The server revalidates it and does NOT call the AI again. */
export function checkAndSaveCorrections(draft: Draft) {
  return postTranscript({ draft });
}
