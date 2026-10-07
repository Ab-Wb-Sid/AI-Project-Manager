/** One unresolved field returned with a 422. `path` looks like "projects.2.tasks.1.assigneeId". */
export interface TranscriptIssue {
  path: string;
  message: string;
}

/** The AI draft as returned by the server. Values may be missing or null when unresolved. */
export interface DraftTask {
  title?: string | null;
  description?: string | null;
  assigneeId?: string | null;
  deadline?: string | null;
  estimatedHours?: number | null;
}

export interface DraftProject {
  name?: string | null;
  clientName?: string | null;
  description?: string | null;
  managerId?: string | null;
  deadline?: string | null;
  tasks?: DraftTask[] | null;
}

export interface Draft {
  projects?: DraftProject[] | null;
}

/** 201 from POST /api/transcript/create */
export interface TranscriptSuccess {
  created: {
    projectCount: number;
    taskCount: number;
    projects: { id: string; name: string; taskCount: number; totalHours?: number }[];
  };
}

/** 422 from POST /api/transcript/create — nothing was saved. */
export interface TranscriptCorrection {
  error: string;
  issues: TranscriptIssue[];
  draft: Draft | unknown;
}
