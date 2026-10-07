import type { Task } from "./task";
import type { PersonRef } from "./user";

/** A project card from GET /api/projects (already scoped by the server). */
export interface ProjectSummary {
  id: string;
  name: string;
  clientName: string;
  description?: string | null;
  /** YYYY-MM-DD */
  deadline: string;
  manager: PersonRef;
  /** For a developer, the server counts only their own tasks. */
  taskCount: number;
  /** Optional: shown on cards when the API provides it. */
  totalHours?: number;
}

/** GET /api/projects/:id — project fields plus the tasks this viewer may see. */
export interface ProjectDetail extends ProjectSummary {
  tasks: Task[];
}
