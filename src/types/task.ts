import type { PersonRef } from "./user";

/** A task row inside GET /api/projects/:id. */
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  /** YYYY-MM-DD */
  deadline: string;
  estimatedHours: number;
  assignee: PersonRef;
}

/** A row from GET /api/my-tasks (developer only). */
export interface MyTask {
  id: string;
  title: string;
  description?: string | null;
  /** YYYY-MM-DD */
  deadline: string;
  estimatedHours: number;
  project: {
    id: string;
    name: string;
    clientName: string;
    manager: PersonRef;
  };
}
