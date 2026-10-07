export type Role = "ADMIN" | "MANAGER" | "AGENT";

/** Shape returned by GET /api/me. Never includes email or password data. */
export interface User {
  id: string;
  name: string;
  role: Role;
  specialization?: string | null;
}

/** Shape returned by GET /api/team (read-only directory). */
export type TeamMember = User;

/** Minimal person reference embedded in projects and tasks. */
export interface PersonRef {
  id: string;
  name: string;
}
